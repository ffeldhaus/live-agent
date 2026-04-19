import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    lib: {
      entry: 'gemini-avatar.js',
      name: 'GeminiAvatar',
      fileName: (format) => `gemini-avatar.${format}.js`,
    },
  },
});
