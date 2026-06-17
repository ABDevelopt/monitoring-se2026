// server.js - Entry point untuk deployment production di cPanel/Dewaweb
// Menggunakan Next.js standalone output agar tidak bergantung pada symlink node_modules

// Paksa production mode
process.env.NODE_ENV = 'production';

// Disable Turbopack secara eksplisit
process.env.NEXT_PRIVATE_LOCAL_WEBPACK = '1';
process.env.NEXT_TELEMETRY_DISABLED = '1';

const path = require('path');

// Cek apakah standalone build tersedia
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const fs = require('fs');

if (fs.existsSync(standaloneServerPath)) {
  // Gunakan standalone server (direkomendasikan untuk hosting)
  console.log('> Menggunakan standalone server...');
  require(standaloneServerPath);
} else {
  // Fallback ke custom server biasa
  console.log('> Standalone tidak ditemukan, menggunakan custom server...');
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  const hostname = 'localhost';
  const port = process.env.PORT || 3000;

  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  });
}
