export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.stories.ts', 'src/generated/**'],
  outdir: 'dist',
  litelement: true,
  // We manage the package.json `customElements` field ourselves.
  packagejson: false,
};
