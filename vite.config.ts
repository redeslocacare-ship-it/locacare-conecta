import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    // Permite acesso via túnel temporário (apresentações)
    allowedHosts: [".trycloudflare.com"],
  },
  build: {
    // Sem sourcemap em produção: nada de código-fonte legível no F12.
    sourcemap: false,
    // Remove console/debugger do bundle — evita vazar payloads e erros internos.
    minify: "esbuild",
  },
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
