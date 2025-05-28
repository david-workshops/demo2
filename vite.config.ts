import { defineConfig } from "vite";
import { resolve } from "path";

// https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated
export default defineConfig({
  root: "src/client",
  publicDir: "public",
  server: {
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, "dist/client"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
