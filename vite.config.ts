import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Carregar variáveis do .env dentro da pasta /client
  const env = loadEnv(mode, path.resolve(__dirname, "client"));

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(mode !== "production" && process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer()
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    define: {
      // Faz o Vite expor as env vars como import.meta.env
      "import.meta.env": Object.entries(env).reduce((prev, [key, val]) => {
        prev[key] = JSON.stringify(val);
        return prev;
      }, {} as Record<string, string>),
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
