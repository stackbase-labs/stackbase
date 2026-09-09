import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  sourcemap: false,
  minify: true,
  dts: false,
  format: ["esm"],
  target: "es2022",
  clean: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
