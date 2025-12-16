'use client';

import { useEffect, useState } from 'react';
import { Plus, Mail, Trash2, Users } from 'lucide-react';
import { CompanyUser } from '@/lib/company/types';
import { getCompanyUsers, inviteUser } from '@/lib/company/api';

interface Props {
  companyId: string;
}

export default function UserManagement({ companyId }: Props) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  useEffect(() => {
    fetchUsers();
  }, [companyId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/company/${companyId}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/company/${companyId}/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (response.ok) {
        setInviteEmail('');
        setShowInvite(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary rounded-md hover:bg-primary-600"
          style={{ color: 'white !important' } as React.CSSProperties}
        >
          <Plus className="h-4 w-4" style={{ color: 'white' }} />
          <span style={{ color: 'white' }}>Invite User</span>
        </button>
      </div>

      {showInvite && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">Invite New User</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="user">User</option>
                <option value="interviewer">Interviewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary rounded-md hover:bg-primary-600"
                style={{ color: 'white !important' } as React.CSSProperties}
              >
                <span style={{ color: 'white' }}>Send Invite</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Company Users</h3>
        </div>
        <div className="divide-y">
          {Array.isArray(users) && users.length > 0 ? users.map((user) => (
            <div key={user.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  {user.role}
                </span>
                <button className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No users found for this company</p>
              <p className="text-sm">Invite users to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}