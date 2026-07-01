import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      // Docker Desktop on Windows 的 bind mount 檔案變更事件常無法傳進容器的 inotify，
      // 用輪詢確保修改檔案後 Vite 一定會重新編譯/HMR，而不是一直serve 舊的快取結果
      usePolling: true,
      interval: 300,
    },
  },
});
