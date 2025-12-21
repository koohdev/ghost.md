import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // React and React DOM
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // Shiki (syntax highlighting) - large library
            if (id.includes("shiki")) {
              return "shiki";
            }
            // Mermaid (diagrams) - large library
            if (id.includes("mermaid")) {
              return "mermaid";
            }
            // KaTeX and math libraries
            if (
              id.includes("katex") ||
              id.includes("rehype-katex") ||
              id.includes("remark-math")
            ) {
              return "math";
            }
            // Markdown processing
            if (
              id.includes("react-markdown") ||
              id.includes("remark") ||
              id.includes("rehype")
            ) {
              return "markdown";
            }
            // Code editor
            if (
              id.includes("react-simple-code-editor") ||
              id.includes("prismjs")
            ) {
              return "editor";
            }
            // Other vendor libraries
            return "vendor";
          }
        },
      },
    },
  },
});
