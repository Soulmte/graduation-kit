import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = env.VITE_API_BASE_URL || "http://localhost:8080";

  return {
    plugins: [vue()],
    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
    server: {
      port: 5175,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/uploads": { target, changeOrigin: true },
      },
    },
    optimizeDeps: {
      exclude: ["@wangeditor/editor"],
    },
  };
});
