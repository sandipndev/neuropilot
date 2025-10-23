import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    background: "src/background/index.ts",
    content: "src/content/index.ts",
    popup: "src/frontend/popup.tsx",
    fullpage: "src/frontend/fullpage.tsx",
  },
  outDir: "dist",
  format: ["esm"], // keeps ESM (required for MV3)
  outExtension: () => ({ js: ".js" }), // 👈 force .js output
  sourcemap: true,
  clean: true,
  minify: true,
  target: "chrome120",
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
  },
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
