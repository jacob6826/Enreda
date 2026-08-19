import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Enables relative asset paths for Electron desktop app compatibility
  server: {
    port: 5173,
    strictPort: true,
  },
});
