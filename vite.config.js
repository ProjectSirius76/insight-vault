import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"],
      manifest: {
        name: "Insight Vault",
        short_name: "Insight Vault",
        description: "A weekly rotation tool for quotes, insights, and lessons you want to lock in.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0a0a0c",
        theme_color: "#0a0a0c",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell only. Firebase Auth/Firestore traffic is left alone —
        // the Firestore SDK handles its own offline cache via IndexedDB,
        // and auth redirects must never be served from a stale cache.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/__\/auth/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
