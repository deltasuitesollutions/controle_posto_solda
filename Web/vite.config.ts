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
        // Em desenvolvimento, aponta para localhost:8000 por padrão
        // Se backend estiver em outra máquina, configure VITE_API_BACKEND_URL
        target: process.env.VITE_API_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true, 
      },
    },
  },
})
