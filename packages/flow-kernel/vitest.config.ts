import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 核心逻辑库不需要浏览器环境，使用 'node' 速度最快
    // 如果后续要测试 React 组件，需改为 'happy-dom' 或 'jsdom'
    environment: 'node',

    // 包含哪些测试文件
    include: ['tests/**/*.test.ts'],

    // 覆盖率配置 (可选)
    coverage: {
      reporter: ['text', 'json', 'html'],
    },

    // 模拟清理
    mockReset: true,
    restoreMocks: true,
  },
})
