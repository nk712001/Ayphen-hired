#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Multi-Tenant Test Suite\n');

const testFiles = [
  '__tests__/multi-tenant/api/organizations.test.ts',
  '__tests__/multi-tenant/api/dashboard.test.ts',
  '__tests__/multi-tenant/api/tests.test.ts',
  '__tests__/multi-tenant/api/user-assignment.test.ts',
  '__tests__/multi-tenant/auth/auth.test.ts',
  '__tests__/multi-tenant/components/CompanySelector.test.tsx',
  '__tests__/multi-tenant/components/OrganizationsPage.test.tsx',
  '__tests__/multi-tenant/integration/data-isolation.test.ts'
];

const results = {
  passed: 0,
  failed: 0,
  total: testFiles.length
};

testFiles.forEach((testFile, index) => {
  console.log(`\n📋 Test ${index + 1}/${testFiles.length}: ${testFile}`);
  console.log('─'.repeat(60));
  
  try {
    execSync(`npx jest ${testFile} --verbose`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    results.passed++;
    console.log('✅ PASSED');
  } catch (error) {
    results.failed++;
    console.log('❌ FAILED');
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 MULTI-TENANT TEST RESULTS');
console.log('='.repeat(60));
console.log(`Total Tests: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n❌ Some tests failed. Please review the output above.');
  process.exit(1);
} else {
  console.log('\n✅ All multi-tenant tests passed!');
  process.exit(0);
}