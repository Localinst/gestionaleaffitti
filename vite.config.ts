import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { resolve } from "path";
// Utilizziamo un approccio semplificato per il prerendering
import fs from 'fs-extra';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: '/',  // Base path per Netlify (senza prefisso)
  build: {
    // Assicura che i percorsi siano relativi nel file HTML generato
    assetsDir: 'assets',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
      },
      output: {
        manualChunks: undefined,
        // Assicura che tutti i path siano correttamente prefissati
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
  },
  server: {
    host: "::",
    port: 8080,
    // Aggiunta configurazione proxy per inoltrare le richieste API al backend
    proxy: {
      // Qualsiasi richiesta che inizi con /api (es. /api/auth/login, /api/admin/users)
      '/api': {
        target: 'http://localhost:3000', // L'indirizzo del tuo server backend
        changeOrigin: true, // Necessario per i virtual host
        secure: false,      // Se il backend usa HTTPS (con certificato valido), impostalo a true
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-sitemap-rss',
      apply: 'build',
      closeBundle() {
        try {
          // Copiare sitemap.xml nella cartella dist
          if (fs.existsSync('./public/sitemap.xml')) {
            if (!fs.existsSync('./dist')) {
              fs.mkdirSync('./dist', { recursive: true });
            }
            fs.copyFileSync('./public/sitemap.xml', './dist/sitemap.xml');
            console.log('File sitemap.xml copiato con successo nella cartella dist');
          }
          
          // Copiare rss.xml nella cartella dist
          if (fs.existsSync('./public/rss.xml')) {
            fs.copyFileSync('./public/rss.xml', './dist/rss.xml');
            console.log('File rss.xml copiato con successo nella cartella dist');
          }
          
          // Copiare robots.txt nella cartella dist
          if (fs.existsSync('./public/robots.txt')) {
            fs.copyFileSync('./public/robots.txt', './dist/robots.txt');
            console.log('File robots.txt copiato con successo nella cartella dist');
          }
          
          // Copiare opensearch.xml nella cartella dist
          if (fs.existsSync('./public/opensearch.xml')) {
            fs.copyFileSync('./public/opensearch.xml', './dist/opensearch.xml');
            console.log('File opensearch.xml copiato con successo nella cartella dist');
          }
          
          // Assicurarsi che il file og-image.jpg sia presente
          if (fs.existsSync('./public/logo.png') && !fs.existsSync('./dist/og-image.jpg')) {
            fs.copyFileSync('./public/logo.png', './dist/og-image.jpg');
            console.log('File og-image.jpg creato nella cartella dist');
          }
        } catch (err) {
          console.error('Errore durante la copia dei file:', err);
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
