import '@testing-library/jest-dom';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedpassword')
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    test: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    testAssignment: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    question: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/test-path'
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn()
}));

// Global test utilities
if (typeof window !== 'undefined') {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
}