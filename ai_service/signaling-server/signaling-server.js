const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const sessions = {};

wss.on('connection', (ws) => {
  let sessionId = null;

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.sessionId) sessionId = data.sessionId;

    // Register client in session
    if (!sessions[sessionId]) sessions[sessionId] = [];
    if (!sessions[sessionId].includes(ws)) sessions[sessionId].push(ws);

    // Relay message to all other clients in the session
    sessions[sessionId].forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    if (sessionId && sessions[sessionId]) {
      sessions[sessionId] = sessions[sessionId].filter(client => client !== ws);
      if (sessions[sessionId].length === 0) delete sessions[sessionId];
    }
  });
});

console.log('WebRTC signaling server running on ws://localhost:8080');
