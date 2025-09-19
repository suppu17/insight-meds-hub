import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    // Enhanced CORS and isolation headers for FFmpeg WebAssembly support
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "cross-origin"
    },
    // Add proper CORS configuration
    cors: {
      origin: true,
      credentials: true
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Exclude FFmpeg packages from pre-bundling to avoid worker issues
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"]
  },
  worker: {
    // Enable proper worker support for FFmpeg
    format: 'es'
  },
  build: {
    // Ensure proper asset handling for FFmpeg WebAssembly files
    target: 'esnext',
    rollupOptions: {
      output: {
        // Handle dynamic imports properly
        manualChunks: {
          'ffmpeg-vendor': ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    },
    // Configure shared array buffer support
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  // Define global constants for proper cross-origin isolation
  define: {
    'global': 'globalThis'
  }
}));
