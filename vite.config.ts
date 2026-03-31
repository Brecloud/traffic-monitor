import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "src/main/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/main"
          }
        }
      },
      preload: {
        input: path.join(__dirname, "src/preload/index.ts"),
        vite: {
          build: {
            outDir: "dist-electron/preload"
          }
        }
      },
      renderer: {}
    })
  ],
  build: {
    outDir: "dist-renderer"
  }
});
