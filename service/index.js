const port = process.argv.length > 2 ? process.argv[2] : 4000;

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const {
  getUserByEmail,
  getUserByUsername,
  getUserByToken,
  addUser: insertUser,
  setUserToken,
  clearUserToken,
  addAuditRecord,
  getAuditsForUser,
  getAuditById,
} = require('./db');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const authCookieName = 'token';

const auditUsage = new Map();

const AUDIT_LIMIT = Number(process.env.AUDIT_LIMIT ?? 3);
const AUDIT_WINDOW_MS = Number(process.env.AUDIT_WINDOW_MS ?? 15 * 60 * 1000);

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json());
app.use(cookieParser());

app.use(express.static('public'));

const publicDir = path.join(__dirname, '..', 'public');
if (path.resolve('public') !== publicDir) {
  app.use(express.static(publicDir));
}

const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.post('/auth/create', async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) {
    res.status(400).send({ msg: 'Missing email, username, or password' });
    return;
  }

  if (await getUserByEmail(email)) {
    res.status(409).send({ msg: 'Email already registered' });
    return;
  }

  if (await getUserByUsername(username)) {
    res.status(409).send({ msg: 'Existing user' });
    return;
  }

  const user = await createUser({ email, username, password });
  setAuthCookie(res, user.token);
  res.send({ username: user.username, email: user.email });
});

apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const user = await getUserByUsername(username);

  if (!user) {
    res.status(401).send({ msg: 'Unauthorized' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).send({ msg: 'Unauthorized' });
    return;
  }

  const token = uuidv4();
  await setUserToken(user._id, token);
  setAuthCookie(res, token);
  res.send({ username: user.username });
});

apiRouter.delete('/auth/logout', async (req, res, next) => {
  try {
    const token = req.cookies[authCookieName];
    if (token) {
      await clearUserToken(token);
    }

    res.clearCookie(authCookieName);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

const verifyAuth = async (req, res, next) => {
  try {
    const token = req.cookies[authCookieName];
    const user = await getUserByToken(token);
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).send({ msg: 'Unauthorized' });
    }
  } catch (err) {
    next(err);
  }
};

apiRouter.get('/profile', verifyAuth, async (req, res, next) => {
  try {
    const userAudits = await getAuditsForUser(req.user.username);
    const sanitizedAudits = userAudits.map(sanitizeAuditForClient);
    res.send({
      email: req.user.email,
      username: req.user.username,
      auditsCompleted: sanitizedAudits.length,
      lastAuditId: sanitizedAudits.at(-1)?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/audit', verifyAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).send({ msg: 'PDF file is required' });
    return;
  }

  if (!openaiClient) {
    res.status(503).send({ msg: 'OpenAI API not configured' });
    return;
  }

  try {
    const now = Date.now();
    const usage = auditUsage.get(req.user.username) || [];
    const recentUsage = usage.filter((timestamp) => now - timestamp < AUDIT_WINDOW_MS);
    if (recentUsage.length >= AUDIT_LIMIT) {
      res.status(429).send({ msg: 'Audit limit reached. Please try again later.' });
      return;
    }

    const { text } = await pdfParse(req.file.buffer);
    const trimmed = text.length > 4000 ? `${text.slice(0, 4000)}...` : text;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial auditing assistant. Provide up to five concise bullet points listing findings or next steps.',
        },
        {
          role: 'user',
          content: `Audit the following PDF content:\n\n${trimmed}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });

    const summary = completion.choices[0]?.message?.content ?? 'No audit summary returned.';

    const auditRecord = {
      id: uuidv4(),
      username: req.user.username,
      filename: req.file.originalname,
      summary,
      createdAt: new Date().toISOString(),
      file: req.file.buffer,
      contentType: req.file.mimetype ?? 'application/pdf',
      fileSize: req.file.size ?? req.file.buffer.length,
    };

    await addAuditRecord(auditRecord);
    auditUsage.set(req.user.username, [...recentUsage, now]);
    res.send(sanitizeAuditForClient(auditRecord));
  } catch (err) {
    console.error('Audit error', err);
    res.status(500).send({ msg: 'Failed to audit PDF' });
  }
});

apiRouter.get('/audit/history', verifyAuth, async (req, res, next) => {
  try {
    const userAudits = await getAuditsForUser(req.user.username);
    res.send(userAudits.map(sanitizeAuditForClient));
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/audit/:id/file', verifyAuth, async (req, res, next) => {
  try {
    const audit = await getAuditById(req.params.id);
    if (!audit || audit.username !== req.user.username) {
      res.status(404).send({ msg: 'File not found' });
      return;
    }

    if (!audit.file) {
      res.status(404).send({ msg: 'No file stored for this audit' });
      return;
    }

    const fileBuffer = audit.file?.buffer ? audit.file.buffer : audit.file;
    res.setHeader('Content-Type', audit.contentType ?? 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${audit.filename ?? 'audit.pdf'}"`
    );
    res.send(fileBuffer);
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send({ type: err.name, message: err.message });
});

app.use((_req, res) => {
  res.sendFile('index.html', { root: publicDir });
});

app.listen(port, () => {
  console.log(`Service listening on port ${port}`);
});

async function createUser({ email, username, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email,
    username,
    password: passwordHash,
    token: uuidv4(),
  };

  return insertUser(user);
}

function sanitizeAuditForClient(audit) {
  if (!audit) return audit;
  const { file, contentType, _id, ...rest } = audit;
  return rest;
}

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}
