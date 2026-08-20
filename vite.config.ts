import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Extract Firebase credentials with fallback to project defaults
  const apiKey = env.VITE_FIREBASE_API_KEY || 'AIzaSyALUCbI2Vfbe6EUcgz-iMpBMcvNYtr7huo';
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || 'enrida-b598f.firebaseapp.com';
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'enrida-b598f';
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || 'enrida-b598f.firebasestorage.app';
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || '985670008273';
  const appId = env.VITE_FIREBASE_APP_ID || '1:985670008273:web:c105340d167a228ddcb4f0';

  return {
    base: './', // Enables relative asset paths for Electron desktop app compatibility
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(authDomain),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(projectId),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(storageBucket),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(messagingSenderId),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(appId),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
