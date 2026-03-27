import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',  // 监听所有网络接口，允许通过局域网 IP 或 127.0.0.1 访问
    port: 5173,       // 指定端口
  },
})
