import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/app/**',            // API routes need heavy mocking
        'src/test-setup.ts',
        'src/types/**',          // pure type definitions
        'src/lib/db.ts',         // Prisma singleton
        'src/lib/providers/**',  // need real API keys
        'src/lib/task-manager.ts', // heavy orchestration
        'src/hooks/useChat.ts',  // depends on browser/network
        'src/components/AnswerColumns/**',
        'src/components/InputPanel/**',
        'src/components/SidePanel/**',
        'src/components/shared/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
