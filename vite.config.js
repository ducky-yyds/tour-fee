import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { normalizeBasePath } from './shared/public-paths.mjs';
import { fileURLToPath } from 'node:url';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  base: normalizeBasePath(process.env.PAGES_BASE_PATH ?? env.PAGES_BASE_PATH ?? '/'),
  define: { 'import.meta.env.VITE_STATIC_DATA': JSON.stringify(mode === 'pages' || (process.env.VITE_STATIC_DATA ?? env.VITE_STATIC_DATA) === 'true' ? 'true' : 'false') },
  resolve: { alias: {
    '@tusuan/locale/jsx-runtime': fileURLToPath(new URL('./src/locale-runtime.mjs', import.meta.url)),
    '@tusuan/locale/jsx-dev-runtime': fileURLToPath(new URL('./src/locale-runtime.mjs', import.meta.url)),
  } },
  optimizeDeps: { exclude: ['@tusuan/locale/jsx-runtime', '@tusuan/locale/jsx-dev-runtime'] },
  plugins: [react({ jsxImportSource: '@tusuan/locale' }), {
    name: 'keep-locale-runtime-in-app',
    enforce: 'post',
    config(config) {
      // plugin-react adds JSX runtimes to prebundling. Our runtime contains app
      // context/state and must share one module instance with the application.
      config.optimizeDeps.include = [...new Set([
        ...(config.optimizeDeps.include || []).filter(id => !id.startsWith('@tusuan/locale/')),
        'react/jsx-runtime', 'react/jsx-dev-runtime',
      ])];
    },
  }],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8787" } },
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist', sourcemap: false },
}; });
