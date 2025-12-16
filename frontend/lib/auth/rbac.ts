export type Permission = 
  | 'manage_users'
  | 'create_test'
  | 'edit_test'
  | 'delete_test'
  | 'view_test'
  | 'take_test'
  | 'view_results'
  | 'manage_proctoring'
  | 'view_analytics';

export type Role = 'admin' | 'proctor' | 'instructor' | 'student' | 'interviewer';

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'manage_users',
    'create_test',
    'edit_test',
    'delete_test',
    'view_test',
    'view_results',
    'manage_proctoring',
    'view_analytics'
  ],
  proctor: [
    'view_test',
    'manage_proctoring',
    'view_results'
  ],
  instructor: [
    'create_test',
    'edit_test',
    'view_test',
    'view_results',
    'view_analytics'
  ],
  interviewer: [
    'create_test',
    'edit_test',
    'view_test',
    'view_results',
    'view_analytics'
  ],
  student: [
    'take_test',
    'view_results'
  ]
};

export class RBACManager {
  private static instance: RBACManager;
  private userRole: Role | null = null;

  private constructor() {}

  static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }

  setUserRole(role: Role | null): void {
    this.userRole = role;
  }

  hasPermission(permission: Permission): boolean {
    if (!this.userRole) return false;
    return rolePermissions[this.userRole].includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getUserPermissions(): Permission[] {
    if (!this.userRole) return [];
    return rolePermissions[this.userRole];
  }
}
