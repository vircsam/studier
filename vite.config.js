import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Custom middleware to serve Vercel serverless functions locally under Vite
const apiMiddleware = () => ({
  name: 'api-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const apiName = url.pathname.slice(5); // remove '/api/'
        const filePath = path.join(__dirname, 'api', `${apiName}.js`);
        
        if (fs.existsSync(filePath)) {
          try {
            // Read body if it's a POST/PUT request
            if (req.method === 'POST' || req.method === 'PUT') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              await new Promise(resolve => req.on('end', resolve));
              try {
                req.body = JSON.parse(body);
              } catch (e) {
                req.body = body;
              }
            } else {
              req.body = {};
            }

            // Mock response helpers for Vercel functions
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            res.send = (data) => {
              res.end(data);
              return res;
            };

            // Mock query parameters
            req.query = Object.fromEntries(url.searchParams);

            // Dynamically import the api handler ES module
            const modulePath = `file://${filePath}`;
            const apiModule = await import(modulePath);
            const handler = apiModule.default;
            
            if (typeof handler === 'function') {
              await handler(req, res);
            } else {
              res.status(500).json({ error: `API ${apiName} does not export a default handler function` });
            }
          } catch (err) {
            console.error(`Error running local API ${apiName}:`, err);
            res.status(500).json({ error: `Internal server error: ${err.message}` });
          }
          return;
        }
      }
      next();
    });
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddleware()],
})
