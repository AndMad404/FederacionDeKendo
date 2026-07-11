import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src/app',
    },
  },
  build: {
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router'],
            },
          },
        },
  },
}))
