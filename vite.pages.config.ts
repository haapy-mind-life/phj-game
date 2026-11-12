/**
 * Independent static Vite build: does not use the SSR/Nitro configuration in vite.config.ts.
 * Output is a normal browser bundle that GitHub Pages can serve.
 *
 * PAGES_BASE_PATH=/ npm run build:pages  # host at another domain's root
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: process.env.PAGES_BASE_PATH ?? "/phj-game/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
  build: {
    outDir: resolve(projectRoot, "dist-pages"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(projectRoot, "pages/index.html"),
    },
  },
});
