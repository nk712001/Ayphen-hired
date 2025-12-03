import { ReactNode, ReactElement } from 'react';
import { Permission, RBACManager } from '@/lib/auth/rbac';

interface RBACGuardProps {
  children: ReactNode;
  requiredPermissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function RBACGuard({
  children,
  requiredPermissions,
  requireAll = false,
  fallback = null
}: RBACGuardProps): ReactElement | null {
  const rbac = RBACManager.getInstance();
  
  const hasAccess = requireAll
    ? rbac.hasAllPermissions(requiredPermissions)
    : rbac.hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Higher-order component for class components
export function withRBAC(
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: Permission[],
  requireAll = false,
  fallback: ReactNode = null
) {
  return function WithRBACWrapper(props: any) {
    return (
      <RBACGuard
        requiredPermissions={requiredPermissions}
        requireAll={requireAll}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </RBACGuard>
    );
  };
}
