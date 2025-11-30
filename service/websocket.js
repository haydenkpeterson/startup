const { WebSocketServer, WebSocket } = require('ws');
const { getUserByToken } = require('./db');

const AUTH_COOKIE = 'token';
const KEEPALIVE_MS = 10000;
const activeSockets = new Map(); // username -> Set<WebSocket>

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

function sendStatusUpdate(username, text) {
  if (!username || !text) return;

  const sockets = activeSockets.get(username);
  if (!sockets || sockets.size === 0) return;
  sockets.forEach((socket) => sendJson(socket, { type: 'status', text }));
  console.log(`[ws] status -> ${username}: ${text}`);
}

function initializeWebSocketServer(httpServer) {
  const socketServer = new WebSocketServer({ server: httpServer, path: '/ws' });

  socketServer.on('connection', async (socket, req) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[AUTH_COOKIE];
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      console.warn('[ws] unauthorized connection attempt');
      socket.close(1008, 'Unauthorized');
      return;
    }

    socket.isAlive = true;
    socket.user = { username: user.username };

    if (!activeSockets.has(user.username)) {
      activeSockets.set(user.username, new Set());
    }
    activeSockets.get(user.username).add(socket);

    console.log(`[ws] connected ${user.username}`);
    sendJson(socket, { type: 'status', text: 'Connected to realtime audit updates.' });

    socket.on('close', () => {
      const set = activeSockets.get(user.username);
      if (set) {
        set.delete(socket);
        if (set.size === 0) {
          activeSockets.delete(user.username);
        }
      }
      console.log(`[ws] disconnected ${user.username}`);
    });

    socket.on('pong', () => {
      socket.isAlive = true;
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
    activeSockets.clear();
  });

  return socketServer;
}

module.exports = { initializeWebSocketServer, sendStatusUpdate };
