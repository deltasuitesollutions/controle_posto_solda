import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Permite acesso de outros IPs na rede
    proxy: {
      '/api': {
        // Proxy para o backend
        // Em Docker, usa o nome do serviço 'backend'
        // Em desenvolvimento local, usa localhost:8000
        // Pode ser sobrescrito via VITE_API_BACKEND_URL
        target: process.env.VITE_API_BACKEND_URL || 
                (process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8000'),
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket support para Socket.IO
      },
      '/socket.io': {
        // Proxy para WebSocket do Socket.IO
        target: process.env.VITE_API_BACKEND_URL || 
                (process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8000'),
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar sourcemaps em produção para segurança
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
})
