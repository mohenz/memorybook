const { transformSync } = require('esbuild');

module.exports = {
  process(sourceText, sourcePath) {
    const loader = sourcePath.endsWith('.tsx') ? 'tsx' : 'ts';
    const { code, map } = transformSync(sourceText, {
      format: 'cjs',
      loader,
      sourcemap: 'inline',
      target: 'node20',
    });

    return { code, map };
  },
};
