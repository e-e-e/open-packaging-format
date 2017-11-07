import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

console.log(Object.keys(pkg.dependencies));

export default {
  input: 'src/opf.js',
  // moduleName: 'dat-library-ui',
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    commonjs(),
    resolve({
      extensions: ['.js', '.json'],
      customResolveOptions: {
        moduleDirectory: 'node_modules',
      },
    }),
  ],
  external: [...Object.keys(pkg.dependencies), 'fs'],
  sourceMap: process.env.NODE_ENV !== 'production',
  output: [{
    file: pkg.module,
    format: 'es',
  },
  {
    file: pkg.main,
    format: 'cjs',
  }],
};
