// // vite.config.ts
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { fileURLToPath, URL } from 'node:url';

// export default defineConfig(({ mode }) => ({
//   // Serve from src/ so src/index.html is the entry
//   root: 'src',
//   // Expose top-level public/ at the server root
//   publicDir: '../public',
//   plugins: [react()],
//   resolve: {
//     // Absolute imports: import ... from '@/editor/ShipsCard'
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url)),
//     },
//   },
//   server: {
//     port: 5174,
//     open: '/index.html',
//   },
//   preview: {
//     port: 5174,
//   },
//   build: {
//     // Emit to top-level dist/ and clean between builds
//     outDir: '../dist',
//     emptyOutDir: true,
//     sourcemap: mode !== 'production',
//     target: 'es2020',
//   },
// }));


// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    base: isProd ? '/shipwright-survivors-waveseditor/' : '/',
    plugins: [react()],
    publicDir: 'public',
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: { port: 5174, open: '/' },
    preview: { port: 5174 },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProd,
      target: 'es2020',
    },
  };
});
