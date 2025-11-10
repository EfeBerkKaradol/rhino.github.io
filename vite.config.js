import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/rhino.github.io/",

  // Optimizasyonlar
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js'i ayrı chunk'ta tut
          three: ["three"],
          // ShapeDiver API'sini ayrı chunk'ta tut
          shapediver: ["@shapediver/viewer"],
          // React vendor'ları ayrı chunk'ta
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
    // Chunk size uyarıları (Three.js büyük olabilir)
    chunkSizeWarningLimit: 1000,
  },

  // Development server ayarları
  server: {
    port: 3000,
    host: true, // Network erişimi için
    https: false, // Kamera testi için geliştirmede HTTP
    hmr: {
      port: 3001,
    },
  },

  // Preview server (build sonrası test)
  preview: {
    port: 3000,
    host: true,
    https: false,
  },

  // Optimizations for faster builds
  optimizeDeps: {
    include: ["three", "@shapediver/viewer", "react", "react-dom"],
  },

  // Environment variables
  define: {
    // Production build için debug kapatma
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
});
