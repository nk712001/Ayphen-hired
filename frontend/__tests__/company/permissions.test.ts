import { canManageCompany, canManageUsers, canViewAnalytics, canCreateTests } from '@/lib/company/permissions';

describe('Company Permissions', () => {
  describe('canManageCompany', () => {
    it('should allow admin users', () => {
      expect(canManageCompany('admin')).toBe(true);
    });

    it('should allow company admins', () => {
      expect(canManageCompany('user', 'admin')).toBe(true);
    });

    it('should deny regular users', () => {
      expect(canManageCompany('user')).toBe(false);
      expect(canManageCompany('user', 'member')).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should allow admin users', () => {
      expect(canManageUsers('admin')).toBe(true);
    });

    it('should allow company admins and managers', () => {
      expect(canManageUsers('user', 'admin')).toBe(true);
      expect(canManageUsers('user', 'manager')).toBe(true);
    });

    it('should deny regular members', () => {
      expect(canManageUsers('user', 'member')).toBe(false);
    });
  });

  describe('canViewAnalytics', () => {
    it('should allow admin users', () => {
      expect(canViewAnalytics('admin')).toBe(true);
    });

    it('should allow company admins and managers', () => {
      expect(canViewAnalytics('user', 'admin')).toBe(true);
      expect(canViewAnalytics('user', 'manager')).toBe(true);
    });

    it('should deny regular members', () => {
      expect(canViewAnalytics('user', 'member')).toBe(false);
    });
  });

  describe('canCreateTests', () => {
    it('should allow admin and interviewer users', () => {
      expect(canCreateTests('admin')).toBe(true);
      expect(canCreateTests('interviewer')).toBe(true);
    });

    it('should allow company admins and managers', () => {
      expect(canCreateTests('user', 'admin')).toBe(true);
      expect(canCreateTests('user', 'manager')).toBe(true);
    });

    it('should deny regular users without proper roles', () => {
      expect(canCreateTests('user')).toBe(false);
      expect(canCreateTests('user', 'member')).toBe(false);
    });
  });
});