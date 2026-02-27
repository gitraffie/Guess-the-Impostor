import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Guess-the-Impostor/',
  server: {
    port: 5173
  }
});
