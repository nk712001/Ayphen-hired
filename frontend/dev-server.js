const https = require('https');
const next = require('next');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'development';
process.env.NEXT_RUNTIME = 'nodejs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Allow self-signed certs for local AI service communication

const dev = true;
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev,
  hostname,
  port,
  experimental: {
    serverActions: true
  }
});

const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
};

app.prepare().then(() => {
  const server = https.createServer(httpsOptions, async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Handle WebSocket upgrade events
  server.on('upgrade', async (req, socket, head) => {
    try {
      await app.getUpgradeHandler()(req, socket, head);
    } catch (err) {
      console.error('Error handling upgrade', err);
      socket.destroy();
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(
      '\x1b[32m%s\x1b[0m',
      `> Ready on https://${hostname}:${port} - env ${process.env.NODE_ENV}`
    );
  });
});
