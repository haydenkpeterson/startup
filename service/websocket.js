const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const { getUserByToken } = require('./db');

const AUTH_COOKIE = 'token';
const KEEPALIVE_MS = 10000;

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => pair.split('=').map((part) => part.trim()))
  );
}

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

async function handleUserMessage({ socket, data }) {
  if (!openaiClient) {
    sendJson(socket, { type: 'error', msg: 'OpenAI API not configured' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (err) {
    sendJson(socket, { type: 'error', msg: 'Invalid message format' });
    return;
  }

  if (parsed?.type !== 'user_message' || !parsed.text) {
    sendJson(socket, { type: 'error', msg: 'Unsupported message' });
    return;
  }

  const messageId = parsed.id || Date.now().toString();

  try {
    const stream = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful auditing chat assistant. Provide concise, clear replies and keep responses focused on the user query.',
        },
        {
          role: 'user',
          content: parsed.text,
        },
      ],
      stream: true,
      temperature: 0.2,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const deltaContent = chunk.choices?.[0]?.delta?.content;
      const delta =
        Array.isArray(deltaContent) && deltaContent.length > 0
          ? deltaContent.map((part) => part.text || '').join('')
          : deltaContent || '';

      if (delta) {
        fullText += delta;
        sendJson(socket, { type: 'ai_token', id: messageId, text: delta });
      }
    }

    sendJson(socket, { type: 'ai_complete', id: messageId, text: fullText });
  } catch (err) {
    console.error('WebSocket AI error', err);
    sendJson(socket, { type: 'error', msg: 'AI response failed' });
  }
}

function initializeWebSocketServer(httpServer) {
  const socketServer = new WebSocketServer({ server: httpServer, path: '/ws' });

  socketServer.on('connection', async (socket, req) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[AUTH_COOKIE];
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    socket.isAlive = true;
    socket.user = { username: user.username };

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', (data) => {
      handleUserMessage({ socket, data });
    });
  });

  const interval = setInterval(() => {
    socketServer.clients.forEach((client) => {
      if (client.isAlive === false) {
        client.terminate();
        return;
      }

      client.isAlive = false;
      client.ping();
    });
  }, KEEPALIVE_MS);

  socketServer.on('close', () => {
    clearInterval(interval);
  });

  return socketServer;
}

module.exports = { initializeWebSocketServer };
