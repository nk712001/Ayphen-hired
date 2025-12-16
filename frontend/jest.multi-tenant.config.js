const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/multi-tenant/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/__tests__/multi-tenant/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/api/admin/organizations/**/*.ts',
    'app/api/dashboard/route.ts',
    'app/api/tests/route.ts',
    'components/ui/CompanySelector.tsx',
    'app/admin/organizations/page.tsx',
    'lib/auth.ts'
  ],
  coverageDirectory: 'coverage/multi-tenant',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};

module.exports = createJestConfig(customJestConfig);