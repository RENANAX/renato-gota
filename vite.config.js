export default {
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost/turnero-api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        customer: 'customer.html',
        worker: 'worker.html',
        sistema: 'sistema.html'
      }
    }
  }
}