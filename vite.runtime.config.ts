import { localIconPlugin } from "./scripts/local-icon-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ command }) => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    localIconPlugin(command),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Jeremy‘s",
        short_name: "Jeremy‘s",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        clientsClaim: true,
        // Warm App modules, story data and images in the background.
        // Audio/video stay click-to-load to avoid downloading the whole music library.
        globPatterns: ["**/*.{js,css,html,svg,json,png,jpg,jpeg,webp}"],
        globIgnores: ["**/workbox-*.js"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "phone-images-v2",
            expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [200] },
          },
        }],
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
}));
