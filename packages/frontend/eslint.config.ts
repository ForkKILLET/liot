import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  ...nextCoreWebVitals,
  ...tseslint.configs.recommended,
  {
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
      indent: ['error', 2],
      'import/no-anonymous-default-export': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
    },
  },
])
