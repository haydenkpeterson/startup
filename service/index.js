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

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const authCookieName = 'token';

const users = [];
const audits = [];

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
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).send({ msg: 'Missing username or password' });
    return;
  }

  if (findUser('username', username)) {
    res.status(409).send({ msg: 'Existing user' });
    return;
  }

  const user = await createUser(username, password);
  setAuthCookie(res, user.token);
  res.send({ username: user.username });
});

apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const user = findUser('username', username);

  if (!user) {
    res.status(401).send({ msg: 'Unauthorized' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).send({ msg: 'Unauthorized' });
    return;
  }

  user.token = uuidv4();
  setAuthCookie(res, user.token);
  res.send({ username: user.username });
});

apiRouter.delete('/auth/logout', (req, res) => {
  const user = findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
  }

  res.clearCookie(authCookieName);
  res.status(204).end();
});

const verifyAuth = (req, res, next) => {
  const user = findUser('token', req.cookies[authCookieName]);
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

apiRouter.get('/profile', verifyAuth, (req, res) => {
  const userAudits = audits.filter((audit) => audit.username === req.user.username);
  res.send({
    username: req.user.username,
    auditsCompleted: userAudits.length,
    lastAuditId: userAudits.at(-1)?.id ?? null,
  });
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
    const { text } = await pdfParse(req.file.buffer);
    const trimmed = text.length > 6000 ? `${text.slice(0, 6000)}...` : text;

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
    };

    audits.push(auditRecord);
    res.send(auditRecord);
  } catch (err) {
    console.error('Audit error', err);
    res.status(500).send({ msg: 'Failed to audit PDF' });
  }
});

apiRouter.get('/audit/history', verifyAuth, (req, res) => {
  const userAudits = audits.filter((audit) => audit.username === req.user.username);
  res.send(userAudits);
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

async function createUser(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    username,
    password: passwordHash,
    token: uuidv4(),
  };

  users.push(user);
  return user;
}

function findUser(field, value) {
  if (!value) return null;
  return users.find((u) => u[field] === value);
}

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}
