# Multi-Tenant Test Suite

## Overview
Comprehensive test suite for multi-tenant functionality covering API routes, authentication, components, and data isolation.

## Test Structure

```
__tests__/multi-tenant/
├── api/
│   ├── organizations.test.ts      # Organization CRUD operations
│   ├── dashboard.test.ts          # Organization-scoped dashboard data
│   ├── tests.test.ts              # Organization-scoped test management
│   └── user-assignment.test.ts    # User-organization assignment
├── auth/
│   └── auth.test.ts               # Authentication with organization context
├── components/
│   ├── CompanySelector.test.tsx   # Organization selector component
│   └── OrganizationsPage.test.tsx # Organization management page
├── integration/
│   └── data-isolation.test.ts     # Cross-organization data access prevention
├── e2e/
│   └── organization-flow.test.ts  # End-to-end organization workflows
├── setup.ts                       # Test setup and mocks
└── test-runner.js                 # Custom test runner
```

## Test Categories

### 1. API Route Tests
- **Organization Management**: CRUD operations, admin authorization
- **Data Scoping**: Organization-filtered queries for dashboard and tests
- **User Assignment**: Admin functionality to assign users to organizations
- **Access Control**: Proper authorization and role validation

### 2. Authentication Tests
- **JWT Enhancement**: Organization context in tokens and sessions
- **User Lookup**: Database queries with organization joins
- **Session Management**: Organization data in user sessions

### 3. Component Tests
- **CompanySelector**: Organization display and switching functionality
- **OrganizationsPage**: Admin interface for organization management
- **Navigation**: Organization context display in UI

### 4. Integration Tests
- **Data Isolation**: Cross-organization access prevention
- **Organization Boundaries**: Proper scoping of all operations
- **Security**: Authorization and data filtering validation

### 5. End-to-End Tests
- **Complete Workflows**: Full organization management flows
- **User Experience**: Multi-tenant UI interactions
- **Data Integrity**: Cross-organization data isolation

## Key Test Scenarios

### Data Isolation
```typescript
// Users from different organizations cannot access each other's data
it('should prevent cross-organization data access', async () => {
  // User from Org A tries to access Org B data
  // Should return empty results or 403 error
});
```

### Organization Scoping
```typescript
// All queries include organization context
it('should filter data by organization', async () => {
  expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
    where: {
      createdBy: 'user1',
      organizationId: 'org1' // Organization filter applied
    }
  });
});
```

### Admin Functionality
```typescript
// Admins can manage organizations and assignments
it('should allow admin to create organizations', async () => {
  const response = await POST(createOrgRequest);
  expect(response.status).toBe(200);
});
```

## Running Tests

### Individual Test Suites
```bash
# API tests
npm run test __tests__/multi-tenant/api/

# Component tests  
npm run test __tests__/multi-tenant/components/

# Integration tests
npm run test __tests__/multi-tenant/integration/
```

### Complete Multi-Tenant Suite
```bash
# Run all multi-tenant tests
npm run test:multi-tenant

# Watch mode
npm run test:multi-tenant:watch

# With coverage
npm run test:multi-tenant:coverage

# Custom runner with detailed output
npm run test:multi-tenant:run
```

## Test Configuration

### Jest Config (`jest.multi-tenant.config.js`)
- Focused on multi-tenant files only
- Proper mocking of dependencies
- Coverage reporting for relevant files
- Custom test environment setup

### Mocks and Setup
- NextAuth session mocking
- Prisma client mocking
- React component testing utilities
- API route testing helpers

## Coverage Targets

### Files Under Test
- `app/api/admin/organizations/**/*.ts`
- `app/api/dashboard/route.ts`
- `app/api/tests/route.ts`
- `components/ui/CompanySelector.tsx`
- `app/admin/organizations/page.tsx`
- `lib/auth.ts`

### Coverage Goals
- **API Routes**: 95%+ coverage
- **Components**: 90%+ coverage
- **Authentication**: 100% coverage
- **Integration**: 85%+ coverage

## Test Data Scenarios

### Organizations
- Active subscription organizations
- Trial organizations
- Expired organizations
- Organizations with/without users

### Users
- Admin users (global access)
- Interviewer users (organization-scoped)
- Users without organizations
- Users switching organizations

### Tests and Assignments
- Organization-scoped tests
- Cross-organization assignment attempts
- Orphaned tests (no organization)
- Mixed organization data sets

## Validation Points

### Security
- ✅ Cross-organization data access prevented
- ✅ Proper role-based authorization
- ✅ Organization context validation
- ✅ API endpoint security

### Functionality
- ✅ Organization CRUD operations
- ✅ User-organization assignment
- ✅ Data filtering and scoping
- ✅ UI organization context

### Performance
- ✅ Efficient database queries
- ✅ Proper indexing usage
- ✅ Minimal API calls
- ✅ Optimized data fetching

## Continuous Integration

### Pre-commit Hooks
```bash
# Run multi-tenant tests before commit
npm run test:multi-tenant
```

### CI Pipeline
```yaml
- name: Multi-Tenant Tests
  run: |
    npm run test:multi-tenant:coverage
    npm run test:multi-tenant:run
```

## Debugging Tests

### Common Issues
1. **Mock Configuration**: Ensure proper Prisma and NextAuth mocking
2. **Async Operations**: Handle promises and async callbacks correctly
3. **Session Context**: Verify organization data in session mocks
4. **Database Queries**: Check organization filtering in where clauses

### Debug Commands
```bash
# Verbose output
npm run test:multi-tenant -- --verbose

# Specific test file
npm run test:multi-tenant -- organizations.test.ts

# Debug mode
npm run test:multi-tenant -- --detectOpenHandles
```

## Maintenance

### Adding New Tests
1. Follow existing test structure and naming
2. Include proper mocking and setup
3. Test both positive and negative scenarios
4. Add integration tests for new features

### Updating Tests
1. Keep tests in sync with implementation changes
2. Update mocks when API contracts change
3. Maintain coverage targets
4. Review test scenarios for completeness