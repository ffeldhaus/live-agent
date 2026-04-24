import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    basicSsl(),
    {
      name: 'local-cors-proxy',
      configureServer(server) {
        server.middlewares.use('/proxy', async (req, res, next) => {
          const urlObj = new URL(req.url!, `https://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');
          
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }
          
          try {
            console.log(`[Proxy] Fetching: ${targetUrl}`);
            const response = await fetch(targetUrl);
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            
            const contentType = response.headers.get('content-type');
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            
            const buffer = await response.arrayBuffer();
            res.writeHead(response.status);
            res.end(Buffer.from(buffer));
            console.log(`[Proxy] Success: ${targetUrl}`);
          } catch (e: any) {
            console.error(`[Proxy] Error: ${e.message}`);
            res.statusCode = 500;
            res.end(e.message);
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    https: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/tokeninfo": {
        target: "https://oauth2.googleapis.com",
        changeOrigin: true,
      },
      "/oauth2/v3/userinfo": {
        target: "https://www.googleapis.com",
        changeOrigin: true,
      },
      "/lh3": {
        target: "https://lh3.googleusercontent.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lh3/, ""),
        headers: {
          Referer: "https://lh3.googleusercontent.com/",
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg"],
  },
  build: {
    lib: {
      entry: "src/gemini-avatar.ts",
      name: "GeminiAvatar",
      fileName: (format) => `gemini-avatar.${format}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: [], // Bundle everything for standalone use, or adjust as needed
    },
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: "jsdom",
  },
});
