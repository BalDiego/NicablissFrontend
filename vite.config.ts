import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const strictProductionBuild = command === "build" && Boolean(
    process.env.VERCEL || process.env.CI || env.VITE_STRICT_PRODUCTION === "true"
  );

  if (strictProductionBuild) {
    const apiUrl = env.VITE_API_URL?.trim();
    if (!apiUrl) throw new Error("VITE_API_URL es obligatorio para compilar en producción");
    const parsed = new URL(apiUrl);
    if (parsed.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      throw new Error("VITE_API_URL debe apuntar a una API HTTPS remota en producción");
    }
    if (!parsed.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
      throw new Error("VITE_API_URL debe terminar en /api/v1");
    }
  }

  return {
    plugins: [react()],
    define: {
      __STRICT_PRODUCTION_API__: JSON.stringify(strictProductionBuild),
    },
  };
});
