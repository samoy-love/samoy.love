import { defineConfig } from 'vitest/config'

// Сквозные тесты живут в e2e/ и запускаются Playwright'ом. Без явного include
// vitest подбирает и их, а playwright-спека в его окружении падает с «did not
// expect test() to be called here» — прогон краснеет там, где всё исправно.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
