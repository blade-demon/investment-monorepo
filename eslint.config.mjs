import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/.cache/**',
    '**/.vite/**',
    '**/.pnpm-store/**',
    '**/.DS_Store',
  ]),

  // JS 基础规则
  js.configs.recommended,

  // TS（包含 TSX）
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // React/TSX 规则（只作用于 TSX，避免影响纯 TS 包）
  {
    files: ['**/*.tsx'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
])
