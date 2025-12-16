'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, TestTube, TrendingUp, Activity, BarChart3 } from 'lucide-react';

interface OrganizationStats {
    id: string;
    name: string;
    subscriptionStatus: string;
    userCount: number;
    testCount: number;
    candidateCount: number;
    activeTests: number;
    completedTests: number;
}

export default function ConsultancyDashboard() {
    const [organizations, setOrganizations] = useState<OrganizationStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/admin/organizations/stats');
            if (response.ok) {
                const data = await response.json();
                setOrganizations(data.organizations);
            }
        } catch (error) {
            console.error('Error fetching organization stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalStats = {
        organizations: organizations.length,
        users: organizations.reduce((sum, org) => sum + org.userCount, 0),
        tests: organizations.reduce((sum, org) => sum + org.testCount, 0),
        candidates: organizations.reduce((sum, org) => sum + org.candidateCount, 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Consultancy Dashboard
                    </h1>
                    <p className="text-gray-600">Overview of all client organizations and recruitment activities</p>
                </div>

                {/* Aggregate Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Organizations</p>
                                <p className="text-3xl font-bold text-gray-900">{totalStats.organizations}</p>
                            </div>
                            <Building2 className="h-12 w-12 text-primary opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{totalStats.users}</p>
                            </div>
                            <Users className="h-12 w-12 text-blue-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Tests</p>
                                <p className="text-3xl font-bold text-gray-900">{totalStats.tests}</p>
                            </div>
                            <TestTube className="h-12 w-12 text-green-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                                <p className="text-3xl font-bold text-gray-900">{totalStats.candidates}</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Organizations List */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold text-gray-900">Client Organizations</h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading organizations...</p>
                        </div>
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Organizations</h3>
                            <p className="text-gray-600">Create your first organization to get started</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {organizations.map((org) => (
                                <div
                                    key={org.id}
                                    className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${org.subscriptionStatus === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : org.subscriptionStatus === 'trial'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {org.subscriptionStatus.charAt(0).toUpperCase() + org.subscriptionStatus.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-8">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900">{org.userCount}</div>
                                                <div className="text-xs text-gray-500">Users</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900">{org.testCount}</div>
                                                <div className="text-xs text-gray-500">Tests</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900">{org.candidateCount}</div>
                                                <div className="text-xs text-gray-500">Candidates</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{org.activeTests}</div>
                                                <div className="text-xs text-gray-500">Active</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{org.completedTests}</div>
                                                <div className="text-xs text-gray-500">Completed</div>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `/admin/organizations`}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                                                style={{ color: 'white' }}
                                            >
                                                <span style={{ color: 'white' }}>Manage</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
