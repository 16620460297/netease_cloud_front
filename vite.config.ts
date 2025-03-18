import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5001,
    host: '0.0.0.0',
    proxy: { // 新增代理配置
      '/api': {
        target: 'http://localhost:5000', // 后端接口地址
        changeOrigin: true, // 允许跨域
        // withCredentials: true,
      },
      '/163': {
        target: 'https://music.163.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/163/, '')
      },
      '/byfuns': {
        target: 'https://www.byfuns.top',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/byfuns/, '')
      }
    }
  }
})
