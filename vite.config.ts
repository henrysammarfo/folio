import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    host: true,
    port: Number(process.env["PORT"]) || 3000,
  },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // SSR entry wrapper lives in src/server.ts
      server: { entry: "server" },
    }),
    viteReact(),
    // Vercel sets VERCEL=1 and needs the vercel preset (.vercel/output).
    // Local preview / Playwright use node-server (.output).
    nitro(
      process.env["VERCEL"]
        ? { preset: "vercel" }
        : { preset: "node-server" },
    ),
  ],
});
