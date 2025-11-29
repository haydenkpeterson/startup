const { WebSocketServer, WebSocket } = require('ws');
const { getUserByToken } = require('./db');

const AUTH_COOKIE = 'token';
const KEEPALIVE_MS = 10000;

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => pair.split('=').map((part) => part.trim()))
  );
}

function initializeWebSocketServer(httpServer) {
  const socketServer = new WebSocketServer({ server: httpServer });

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

    socket.on('message', (_data) => {
      // Chat handling will be added in the next step.
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
