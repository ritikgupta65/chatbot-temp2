import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/offers': {
        target: 'https://ritik-n8n-e9673da43cf4.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => '/webhook/get-offers',
        timeout: 10000,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Offers response:', proxyRes.statusCode);
          });
        }
      },
      '/api/try-on-status': {
        target: 'https://ritik-n8n-e9673da43cf4.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => '/webhook/webhook/try-on-status' + path.replace('/api/try-on-status', ''),
        timeout: 10000, // 10 seconds - polling should be fast
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Poll response:', proxyRes.statusCode);
          });
        }
      },
      '/api/try-on': {
        target: 'https://ritik-n8n-e9673da43cf4.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => '/webhook/2598d12d-a13f-4759-ae5b-1e0262e33b9c',
        timeout: 30000, // 30 seconds - matches Heroku limit
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, proxyRes.headers['content-type']);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
