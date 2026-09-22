import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { normalizeBasePath } from './shared/public-paths.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  base: normalizeBasePath(process.env.PAGES_BASE_PATH ?? env.PAGES_BASE_PATH ?? '/'),
  define: { 'import.meta.env.VITE_STATIC_DATA': JSON.stringify(mode === 'pages' || process.env.VITE_STATIC_DATA === 'true' || env.VITE_STATIC_DATA === 'true' ? 'true' : 'false') },
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8787" } },
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist', sourcemap: false },
}; });
