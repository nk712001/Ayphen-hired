const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

// Path to your SSL certificate and key (use self-signed for dev)
const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem'),
});

const wss = new WebSocket.Server({ server });
const sessions = {};

wss.on('connection', (ws) => {
  let sessionId = null;

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.sessionId) sessionId = data.sessionId;
    if (!sessions[sessionId]) sessions[sessionId] = [];
    if (!sessions[sessionId].includes(ws)) sessions[sessionId].push(ws);
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

server.listen(8443, () => {
  console.log('WebRTC secure signaling server running on wss://localhost:8443');
});
