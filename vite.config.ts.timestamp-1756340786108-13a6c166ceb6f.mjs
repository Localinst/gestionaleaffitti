// vite.config.ts
import { defineConfig } from "file:///C:/Users/ReadyToUse/lavoro/gestionale-affitti/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ReadyToUse/lavoro/gestionale-affitti/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { resolve } from "path";
import fs from "file:///C:/Users/ReadyToUse/lavoro/gestionale-affitti/node_modules/fs-extra/lib/index.js";
var __vite_injected_original_dirname = "C:\\Users\\ReadyToUse\\lavoro\\gestionale-affitti";
var vite_config_default = defineConfig(() => ({
  base: "/",
  // Base path per Netlify (senza prefisso)
  build: {
    // Assicura che i percorsi siano relativi nel file HTML generato
    assetsDir: "assets",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        404: resolve(__vite_injected_original_dirname, "404.html")
      },
      output: {
        manualChunks: void 0,
        // Assicura che tutti i path siano correttamente prefissati
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  server: {
    host: "::",
    port: 8080,
    // Configurazione per il supporto di URL multilingua in sviluppo
    historyApiFallback: {
      rewrites: [
        // Reindirizza tutte le richieste che iniziano con /it, /en, ecc. a index.html
        { from: /^\/it\/.*/, to: "/index.html" },
        { from: /^\/en\/.*/, to: "/index.html" },
        { from: /^\/fr\/.*/, to: "/index.html" },
        { from: /^\/de\/.*/, to: "/index.html" },
        { from: /^\/es\/.*/, to: "/index.html" },
        { from: /^\/en-gb\/.*/, to: "/index.html" },
        // Reindirizza tutte le altre richieste a index.html
        { from: /./, to: "/index.html" }
      ]
    },
    // Aggiunta configurazione proxy per inoltrare le richieste API al backend
    proxy: {
      // Qualsiasi richiesta che inizi con /api (es. /api/auth/login, /api/admin/users)
      "/api": {
        target: "http://localhost:3000",
        // L'indirizzo del tuo server backend
        changeOrigin: true,
        // Necessario per i virtual host
        secure: false
        // Se il backend usa HTTPS (con certificato valido), impostalo a true
      }
    }
  },
  plugins: [
    react(),
    {
      name: "copy-sitemap-rss",
      apply: "build",
      closeBundle() {
        try {
          if (fs.existsSync("./public/sitemap.xml")) {
            if (!fs.existsSync("./dist")) {
              fs.mkdirSync("./dist", { recursive: true });
            }
            fs.copyFileSync("./public/sitemap.xml", "./dist/sitemap.xml");
            console.log("File sitemap.xml copiato con successo nella cartella dist");
          }
          if (fs.existsSync("./public/rss.xml")) {
            fs.copyFileSync("./public/rss.xml", "./dist/rss.xml");
            console.log("File rss.xml copiato con successo nella cartella dist");
          }
          if (fs.existsSync("./public/robots.txt")) {
            fs.copyFileSync("./public/robots.txt", "./dist/robots.txt");
            console.log("File robots.txt copiato con successo nella cartella dist");
          }
          if (fs.existsSync("./public/opensearch.xml")) {
            fs.copyFileSync("./public/opensearch.xml", "./dist/opensearch.xml");
            console.log("File opensearch.xml copiato con successo nella cartella dist");
          }
          if (fs.existsSync("./public/logo.png") && !fs.existsSync("./dist/og-image.jpg")) {
            fs.copyFileSync("./public/logo.png", "./dist/og-image.jpg");
            console.log("File og-image.jpg creato nella cartella dist");
          }
          const languages = ["it", "en", "fr", "de", "es", "en-gb"];
          languages.forEach((lang) => {
            const langDir = `./dist/${lang}`;
            if (!fs.existsSync(langDir)) {
              fs.mkdirSync(langDir, { recursive: true });
            }
            fs.copyFileSync("./dist/index.html", `${langDir}/index.html`);
            console.log(`File index.html copiato nella cartella ${lang}`);
          });
        } catch (err) {
          console.error("Errore durante la copia dei file:", err);
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSZWFkeVRvVXNlXFxcXGxhdm9yb1xcXFxnZXN0aW9uYWxlLWFmZml0dGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFJlYWR5VG9Vc2VcXFxcbGF2b3JvXFxcXGdlc3Rpb25hbGUtYWZmaXR0aVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvUmVhZHlUb1VzZS9sYXZvcm8vZ2VzdGlvbmFsZS1hZmZpdHRpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XHJcbi8vIFV0aWxpenppYW1vIHVuIGFwcHJvY2NpbyBzZW1wbGlmaWNhdG8gcGVyIGlsIHByZXJlbmRlcmluZ1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+ICh7XHJcbiAgYmFzZTogJy8nLCAgLy8gQmFzZSBwYXRoIHBlciBOZXRsaWZ5IChzZW56YSBwcmVmaXNzbylcclxuICBidWlsZDoge1xyXG4gICAgLy8gQXNzaWN1cmEgY2hlIGkgcGVyY29yc2kgc2lhbm8gcmVsYXRpdmkgbmVsIGZpbGUgSFRNTCBnZW5lcmF0b1xyXG4gICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcclxuICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiaW5kZXguaHRtbFwiKSxcclxuICAgICAgICA0MDQ6IHJlc29sdmUoX19kaXJuYW1lLCBcIjQwNC5odG1sXCIpLFxyXG4gICAgICB9LFxyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCxcclxuICAgICAgICAvLyBBc3NpY3VyYSBjaGUgdHV0dGkgaSBwYXRoIHNpYW5vIGNvcnJldHRhbWVudGUgcHJlZmlzc2F0aVxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgICAvLyBDb25maWd1cmF6aW9uZSBwZXIgaWwgc3VwcG9ydG8gZGkgVVJMIG11bHRpbGluZ3VhIGluIHN2aWx1cHBvXHJcbiAgICBoaXN0b3J5QXBpRmFsbGJhY2s6IHtcclxuICAgICAgcmV3cml0ZXM6IFtcclxuICAgICAgICAvLyBSZWluZGlyaXp6YSB0dXR0ZSBsZSByaWNoaWVzdGUgY2hlIGluaXppYW5vIGNvbiAvaXQsIC9lbiwgZWNjLiBhIGluZGV4Lmh0bWxcclxuICAgICAgICB7IGZyb206IC9eXFwvaXRcXC8uKi8sIHRvOiAnL2luZGV4Lmh0bWwnIH0sXHJcbiAgICAgICAgeyBmcm9tOiAvXlxcL2VuXFwvLiovLCB0bzogJy9pbmRleC5odG1sJyB9LFxyXG4gICAgICAgIHsgZnJvbTogL15cXC9mclxcLy4qLywgdG86ICcvaW5kZXguaHRtbCcgfSxcclxuICAgICAgICB7IGZyb206IC9eXFwvZGVcXC8uKi8sIHRvOiAnL2luZGV4Lmh0bWwnIH0sXHJcbiAgICAgICAgeyBmcm9tOiAvXlxcL2VzXFwvLiovLCB0bzogJy9pbmRleC5odG1sJyB9LFxyXG4gICAgICAgIHsgZnJvbTogL15cXC9lbi1nYlxcLy4qLywgdG86ICcvaW5kZXguaHRtbCcgfSxcclxuICAgICAgICAvLyBSZWluZGlyaXp6YSB0dXR0ZSBsZSBhbHRyZSByaWNoaWVzdGUgYSBpbmRleC5odG1sXHJcbiAgICAgICAgeyBmcm9tOiAvLi8sIHRvOiAnL2luZGV4Lmh0bWwnIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgLy8gQWdnaXVudGEgY29uZmlndXJhemlvbmUgcHJveHkgcGVyIGlub2x0cmFyZSBsZSByaWNoaWVzdGUgQVBJIGFsIGJhY2tlbmRcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIC8vIFF1YWxzaWFzaSByaWNoaWVzdGEgY2hlIGluaXppIGNvbiAvYXBpIChlcy4gL2FwaS9hdXRoL2xvZ2luLCAvYXBpL2FkbWluL3VzZXJzKVxyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLCAvLyBMJ2luZGlyaXp6byBkZWwgdHVvIHNlcnZlciBiYWNrZW5kXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLCAvLyBOZWNlc3NhcmlvIHBlciBpIHZpcnR1YWwgaG9zdFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsICAgICAgLy8gU2UgaWwgYmFja2VuZCB1c2EgSFRUUFMgKGNvbiBjZXJ0aWZpY2F0byB2YWxpZG8pLCBpbXBvc3RhbG8gYSB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6ICdjb3B5LXNpdGVtYXAtcnNzJyxcclxuICAgICAgYXBwbHk6ICdidWlsZCcsXHJcbiAgICAgIGNsb3NlQnVuZGxlKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAvLyBDb3BpYXJlIHNpdGVtYXAueG1sIG5lbGxhIGNhcnRlbGxhIGRpc3RcclxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKCcuL3B1YmxpYy9zaXRlbWFwLnhtbCcpKSB7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYygnLi9kaXN0JykpIHtcclxuICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoJy4vZGlzdCcsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYygnLi9wdWJsaWMvc2l0ZW1hcC54bWwnLCAnLi9kaXN0L3NpdGVtYXAueG1sJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGaWxlIHNpdGVtYXAueG1sIGNvcGlhdG8gY29uIHN1Y2Nlc3NvIG5lbGxhIGNhcnRlbGxhIGRpc3QnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQ29waWFyZSByc3MueG1sIG5lbGxhIGNhcnRlbGxhIGRpc3RcclxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKCcuL3B1YmxpYy9yc3MueG1sJykpIHtcclxuICAgICAgICAgICAgZnMuY29weUZpbGVTeW5jKCcuL3B1YmxpYy9yc3MueG1sJywgJy4vZGlzdC9yc3MueG1sJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGaWxlIHJzcy54bWwgY29waWF0byBjb24gc3VjY2Vzc28gbmVsbGEgY2FydGVsbGEgZGlzdCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBDb3BpYXJlIHJvYm90cy50eHQgbmVsbGEgY2FydGVsbGEgZGlzdFxyXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoJy4vcHVibGljL3JvYm90cy50eHQnKSkge1xyXG4gICAgICAgICAgICBmcy5jb3B5RmlsZVN5bmMoJy4vcHVibGljL3JvYm90cy50eHQnLCAnLi9kaXN0L3JvYm90cy50eHQnKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgcm9ib3RzLnR4dCBjb3BpYXRvIGNvbiBzdWNjZXNzbyBuZWxsYSBjYXJ0ZWxsYSBkaXN0Jyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIENvcGlhcmUgb3BlbnNlYXJjaC54bWwgbmVsbGEgY2FydGVsbGEgZGlzdFxyXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoJy4vcHVibGljL29wZW5zZWFyY2gueG1sJykpIHtcclxuICAgICAgICAgICAgZnMuY29weUZpbGVTeW5jKCcuL3B1YmxpYy9vcGVuc2VhcmNoLnhtbCcsICcuL2Rpc3Qvb3BlbnNlYXJjaC54bWwnKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgb3BlbnNlYXJjaC54bWwgY29waWF0byBjb24gc3VjY2Vzc28gbmVsbGEgY2FydGVsbGEgZGlzdCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBBc3NpY3VyYXJzaSBjaGUgaWwgZmlsZSBvZy1pbWFnZS5qcGcgc2lhIHByZXNlbnRlXHJcbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYygnLi9wdWJsaWMvbG9nby5wbmcnKSAmJiAhZnMuZXhpc3RzU3luYygnLi9kaXN0L29nLWltYWdlLmpwZycpKSB7XHJcbiAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYygnLi9wdWJsaWMvbG9nby5wbmcnLCAnLi9kaXN0L29nLWltYWdlLmpwZycpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRmlsZSBvZy1pbWFnZS5qcGcgY3JlYXRvIG5lbGxhIGNhcnRlbGxhIGRpc3QnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQ3JlYXJlIGZpbGUgZGkgcmVpbmRpcml6emFtZW50byBwZXIgaSBwZXJjb3JzaSBtdWx0aWxpbmd1YVxyXG4gICAgICAgICAgLy8gUXVlc3RvIFx1MDBFOCBuZWNlc3NhcmlvIHBlciBTUEEgaG9zdGF0aSBzdSBzZXJ2ZXIgc3RhdGljaVxyXG4gICAgICAgICAgY29uc3QgbGFuZ3VhZ2VzID0gWydpdCcsICdlbicsICdmcicsICdkZScsICdlcycsICdlbi1nYiddO1xyXG4gICAgICAgICAgbGFuZ3VhZ2VzLmZvckVhY2gobGFuZyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhbmdEaXIgPSBgLi9kaXN0LyR7bGFuZ31gO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobGFuZ0RpcikpIHtcclxuICAgICAgICAgICAgICBmcy5ta2RpclN5bmMobGFuZ0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnMuY29weUZpbGVTeW5jKCcuL2Rpc3QvaW5kZXguaHRtbCcsIGAke2xhbmdEaXJ9L2luZGV4Lmh0bWxgKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYEZpbGUgaW5kZXguaHRtbCBjb3BpYXRvIG5lbGxhIGNhcnRlbGxhICR7bGFuZ31gKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3JlIGR1cmFudGUgbGEgY29waWEgZGVpIGZpbGU6JywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVUsU0FBUyxvQkFBb0I7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
