import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only: POST a data URL to /__capture?name=x and it lands in .captures/x.jpg.
// Used to inspect rendered frames while tuning the choreography.
const capture = {
  name: 'fracture-capture',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__capture', (req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const name = new URL(req.url, 'http://x').searchParams.get('name') || 'frame';
        const dir = path.resolve('.captures');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${name.replace(/[^\w.-]/g, '_')}.jpg`), Buffer.from(body.split(',')[1], 'base64'));
        res.end('ok');
      });
    });
  },
};

// `npm run dev:phone` serves over HTTPS on the local network, for testing on a
// phone: wake lock, tilt and iOS's motion permission only work on secure pages.
// The certificate is self-signed, so the phone warns once; proceed past it.
export default defineConfig(({ mode }) => ({
  // relative URLs, so the build works from any folder (GitHub Pages serves it under /<repo>/)
  base: './',
  plugins: [capture, ...(mode === 'phone' ? [basicSsl()] : [])],
  server: { port: 5173, strictPort: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
}));
