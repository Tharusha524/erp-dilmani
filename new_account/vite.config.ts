import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget =
    env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8000'
  const rawBasePath = (env.VITE_APP_BASE_PATH?.trim() || '/sky_erp').replace(/^\/+|\/+$/g, '')
  const basePath = `/${rawBasePath}/`

  return {
  base: basePath,
  plugins: [react()],
  server: {
    // Optional: set VITE_API_BASE_URL=/api in .env.local to proxy to local Laravel
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          mui: ["@mui/material", "@mui/icons-material"],
          lodash: ["lodash"],
        },
      },
    },
  },
  };
});
