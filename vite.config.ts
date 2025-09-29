import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react()],
    // 配置GitHub Pages的基础路径
    base: env.NODE_ENV === 'production' ? '/probability-distribution-app/' : '/',
  }
})
