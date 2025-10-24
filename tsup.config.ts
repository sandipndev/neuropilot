import { defineConfig } from "tsup";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";
import assert from "assert";

// Make sure frontend is built!
const frontendPagesBasePath = 'src/frontend/pages'

export default defineConfig({
  entry: {
    background: "src/background/index.ts",
    content: "src/content/index.ts",
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

  onSuccess: async () => {
    console.log('📦 Processing frontend pages...');

    // list all directories in frontendPagesBasePath
    const directories = readdirSync(frontendPagesBasePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`Found ${directories.length} page(s): ${directories.join(', ')}`);

    directories.forEach(pageName => {
      console.log(`\n🔄 Processing page: ${pageName}`);

      const sourceDir = `${frontendPagesBasePath}/${pageName}/dist`;
      const targetDir = `dist/`;

      // Read all files and directories in the source directory
      const items = readdirSync(sourceDir);

      items.forEach(itemName => {
        const sourcePath = `${sourceDir}/${itemName}`;
        const isDirectory = statSync(sourcePath).isDirectory();

        if (isDirectory) {
          // Copy entire directory recursively (merge, don't overwrite)
          const targetPath = `${targetDir}/${itemName}`;
          console.log(`  ✓ Copying directory ${itemName}/`);

          const copyRecursive = (src: string, dest: string) => {
            const entries = readdirSync(src, { withFileTypes: true });

            for (const entry of entries) {
              const srcPath = path.join(src, entry.name);
              const destPath = path.join(dest, entry.name);

              if (entry.isDirectory()) {
                // Create directory if it doesn't exist
                if (!existsSync(destPath)) {
                  mkdirSync(destPath, { recursive: true });
                }
                copyRecursive(srcPath, destPath);
              } else {
                // Only copy file if it doesn't exist
                if (!existsSync(destPath)) {
                  copyFileSync(srcPath, destPath);
                }
              }
            }
          };

          // Ensure target directory exists
          if (!existsSync(targetPath)) {
            mkdirSync(targetPath, { recursive: true });
          }
          copyRecursive(sourcePath, targetPath);
        } else {
          // Handle files
          let targetPath: string;

          // assert it's index.html
          assert(itemName === 'index.html', `Expected index.html, got ${itemName}`);


          targetPath = `${targetDir}/${pageName}.html`;
          console.log(`  ✓ Copying ${itemName} to ${targetPath}`);

          copyFileSync(sourcePath, targetPath);
        }
      });
    });

    console.log('\n✅ Frontend pages processed successfully!');
  },
});
