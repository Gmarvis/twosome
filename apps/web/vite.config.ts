import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "twosome.",
        short_name: "twosome",
        description: "games for two humans",
        theme_color: "#1A1A1A",
        background_color: "#F5F1EB",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  envDir: path.resolve(__dirname, "../.."),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@twosome/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@twosome/domain": path.resolve(__dirname, "../../packages/domain/src"),
      "@twosome/application": path.resolve(__dirname, "../../packages/application/src"),
      "@twosome/infrastructure": path.resolve(__dirname, "../../packages/infrastructure/src"),
    },
  },
});
