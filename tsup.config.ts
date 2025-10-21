import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    background: "src/background.ts",
    content: "src/content.ts",
    popup: "src/popup/index.tsx",
  },
  outDir: "dist",
  format: ["esm"],      // keeps ESM (required for MV3)
  outExtension: () => ({ js: ".js" }), // 👈 force .js output
  sourcemap: true,
  clean: true,
  minify: true,
  target: "chrome120",
});
