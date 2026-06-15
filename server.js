const express = require('express');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // serve uploaded profile images
  server.use('/img', express.static(path.join(__dirname, 'public/img')));

  // serve community document uploads
  server.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  // serve manual HTML
  server.use('/manual.html', express.static(path.join(__dirname, 'public/manual.html')));

  // all other requests → Next.js
  server.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
