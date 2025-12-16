export function canManageCompany(userRole: string, companyRole?: string): boolean {
  return userRole === 'admin' || companyRole === 'admin';
}

export function canManageUsers(userRole: string, companyRole?: string): boolean {
  return userRole === 'admin' || companyRole === 'admin' || companyRole === 'manager';
}

export function canViewAnalytics(userRole: string, companyRole?: string): boolean {
  return userRole === 'admin' || companyRole === 'admin' || companyRole === 'manager';
}

export function canCreateTests(userRole: string, companyRole?: string): boolean {
  return userRole === 'admin' || userRole === 'interviewer' || companyRole === 'admin' || companyRole === 'manager';
}