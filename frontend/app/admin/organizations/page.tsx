'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Plus, Eye, Trash2, X, Search, Filter, Calendar, Activity, UserPlus } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  subscriptionStatus: string;
  userCount: number;
  testCount: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newOrgName, setNewOrgName] = useState('');
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedOrgUsers, setSelectedOrgUsers] = useState<User[]>([]);
  const [selectedOrgName, setSelectedOrgName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() })
      });

      if (response.ok) {
        setNewOrgName('');
        setShowCreateForm(false);
        fetchOrganizations();
      }
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const assignUserToOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedOrg) return;

    try {
      const response = await fetch('/api/admin/users/assign-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser, 
          organizationId: selectedOrg === 'none' ? null : selectedOrg 
        })
      });

      if (response.ok) {
        setSelectedUser('');
        setSelectedOrg('');
        setShowAssignForm(false);
        fetchUsers();
        fetchOrganizations();
      }
    } catch (error) {
      console.error('Error assigning user:', error);
    }
  };

  const viewOrgUsers = (orgId: string, orgName: string) => {
    const orgUsers = users.filter(user => user.organizationId === orgId);
    setSelectedOrgUsers(orgUsers);
    setSelectedOrgName(orgName);
    setShowUsersModal(true);
  };

  const deleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This will remove all users from it.')) return;

    try {
      const response = await fetch(`/api/admin/organizations?id=${orgId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchOrganizations();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        fetchOrganizations();
        if (showUsersModal) {
          const orgUsers = users.filter(user => user.organizationId === selectedOrgUsers[0]?.organizationId && user.id !== userId);
          setSelectedOrgUsers(orgUsers);
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.subscriptionStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Organizations
            </h1>
            <p className="text-gray-600">Manage organizations and user assignments</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary-400 text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Organization
            </button>
            <button
              onClick={() => setShowAssignForm(true)}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Assign User
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search organizations by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-4">Create Organization</h3>
              <form onSubmit={createOrganization}>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Organization name"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {showAssignForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-4">Assign User to Organization</h3>
              <form onSubmit={assignUserToOrg}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                    <select
                      value={selectedOrg}
                      onChange={(e) => setSelectedOrg(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select organization</option>
                      <option value="none">Remove from organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations in system</h3>
            <p className="text-gray-500 mb-6">Create your first organization to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary-400 text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary-500 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Organization
            </button>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-6">No organizations match your current search criteria</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrganizations.map((org) => (
              <div key={org.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-400 rounded-full flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            org.subscriptionStatus === 'active' 
                              ? 'bg-slate-100 text-slate-800'
                              : org.subscriptionStatus === 'trial'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            <Activity className="h-3 w-3 mr-1" />
                            {org.subscriptionStatus.charAt(0).toUpperCase() + org.subscriptionStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{org.userCount}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center">
                          <Users className="h-4 w-4 mr-1" />
                          Users
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{org.testCount}</div>
                        <div className="text-sm text-gray-500">Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/company/${org.id}/dashboard`, '_blank')}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="Open Company Dashboard"
                        >
                          <Building2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => viewOrgUsers(org.id, org.name)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                          title="View Users"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteOrganization(org.id)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                          title="Delete Organization"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {showUsersModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Users in {selectedOrgName}</h3>
                  <button
                    onClick={() => setShowUsersModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {selectedOrgUsers.length === 0 ? (
                  <p className="text-gray-500">No users in this organization.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrgUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email} • {user.role}</div>
                        </div>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}