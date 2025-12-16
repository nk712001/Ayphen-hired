import { render, screen } from '@testing-library/react';
import { RBACGuard, withRBAC } from '@/components/auth/RBACGuard';
import { RBACManager } from '@/lib/auth/rbac';

describe('RBACGuard', () => {
  const rbacManager = RBACManager.getInstance();
  const TestComponent = () => <div>Protected Content</div>;
  const FallbackComponent = () => <div>Access Denied</div>;

  beforeEach(() => {
    rbacManager.setUserRole('admin');
  });

  describe('Direct Component Usage', () => {
    it('should render children when user has required permission', () => {
      render(
        <RBACGuard requiredPermissions={['manage_users']}>
          <TestComponent />
        </RBACGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      rbacManager.setUserRole('student');
      render(
        <RBACGuard 
          requiredPermissions={['manage_users']} 
          fallback={<FallbackComponent />}
        >
          <TestComponent />
        </RBACGuard>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should handle multiple permissions with requireAll=true', () => {
      rbacManager.setUserRole('admin');
      render(
        <RBACGuard 
          requiredPermissions={['manage_users', 'create_test']} 
          requireAll={true}
        >
          <TestComponent />
        </RBACGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle multiple permissions with requireAll=false', () => {
      rbacManager.setUserRole('instructor');
      render(
        <RBACGuard 
          requiredPermissions={['manage_users', 'create_test']} 
          requireAll={false}
        >
          <TestComponent />
        </RBACGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render nothing when no fallback is provided and access is denied', () => {
      rbacManager.setUserRole('student');
      render(
        <RBACGuard requiredPermissions={['manage_users']}>
          <TestComponent />
        </RBACGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('HOC Usage', () => {
    const WrappedComponent = withRBAC(
      TestComponent,
      ['manage_users'],
      false,
      <FallbackComponent />
    );

    it('should render component when user has permission', () => {
      rbacManager.setUserRole('admin');
      render(<WrappedComponent />);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      rbacManager.setUserRole('student');
      render(<WrappedComponent />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
