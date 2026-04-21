import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), basicSsl()],
  server: {
    port: 3000,
    https: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
  build: {
    lib: {
      entry: 'src/gemini-avatar.ts',
      name: 'GeminiAvatar',
      fileName: (format) => `gemini-avatar.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [], // Bundle everything for standalone use, or adjust as needed
    },
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
