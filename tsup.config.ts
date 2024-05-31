import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['./src/index.ts', './src/queries.ts', './src/validation.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true
});
