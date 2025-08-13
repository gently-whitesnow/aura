import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/v1': { target, changeOrigin: true },
        '/mcp': { target, changeOrigin: true },
      },
    },
  }
})
