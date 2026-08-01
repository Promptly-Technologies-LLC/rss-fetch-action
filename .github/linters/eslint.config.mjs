import babelParser from '@babel/eslint-parser'
import github from 'eslint-plugin-github'
import jestPlugin from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'lib/**',
      'node_modules/**',
      '**/*.json'
    ]
  },
  github.getFlatConfigs().recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['babel-preset-jest']
        }
      },
      globals: {
        ...globals.node,
        ...globals.es2023,
        ...globals.jest,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      }
    },
    plugins: {
      jest: jestPlugin
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      camelcase: 'off',
      'eslint-comments/no-use': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'i18n-text/no-en': 'off',
      'import/no-commonjs': 'off',
      'import/no-namespace': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      semi: 'off'
    }
  }
]
