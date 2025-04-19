import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { resolve } from "path";
// Modifica: utilizziamo un plugin supportato per il prerendering
// Nota: Installa questi pacchetti prima di decommentare:
// npm install -D vite-plugin-static-copy
// npm install -D @prerenderer/prerender-spa-plugin puppeteer
// import staticCopy from 'vite-plugin-static-copy'
// import fs from 'fs';
// import PrerenderSPAPlugin from '@prerenderer/prerender-spa-plugin';
// const Renderer = PrerenderSPAPlugin.PuppeteerRenderer;

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
        // Opzionale: riscrivi il percorso se necessario (non sembra servire qui)
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  },
  plugins: [
    react(),
    // Decommentare quando i pacchetti sono installati:
    // {
    //   name: 'prerender-spa',
    //   apply: 'build',
    //   configResolved() {
    //     // Creazione della cartella necessaria per il prerender
    //     if (!fs.existsSync(resolve(__dirname, "dist"))) {
    //       fs.mkdirSync(resolve(__dirname, "dist"), { recursive: true });
    //     }
    //   },
    //   closeBundle() {
    //     // Esegue il prerendering dopo la build
    //     const prerenderer = new PrerenderSPAPlugin({
    //       staticDir: resolve(__dirname, 'dist'),
    //       routes: ['/', '/blog', '/guide', '/supporto', '/privacy', '/termini', '/cookie', '/pricing'],
    //       renderer: new Renderer({
    //         renderAfterDocumentEvent: 'render-complete',
    //         headless: true,
    //       })
    //     });
    //     
    //     return prerenderer.apply({ hooks: { thisCompilation: (compilation) => {
    //       compilation.hooks.additionalAssets = { tap: () => {} };
    //     }}});
    //   }
    // }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
