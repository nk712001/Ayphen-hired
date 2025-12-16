'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, TestTube, CheckCircle, Clock, TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';
import { useOrganization } from '@/providers/OrganizationProvider';

interface DashboardStats {
    totalCandidates: number;
    totalTests: number;
    activeAssignments: number;
    completedAssignments: number;
    recentActivity: Array<{
        id: string;
        type: string;
        message: string;
        timestamp: string;
    }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const { currentOrg } = useOrganization();
    const [stats, setStats] = useState<DashboardStats>({
        totalCandidates: 0,
        totalTests: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        recentActivity: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentOrg) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Fetch candidates
                const candidatesRes = await fetch(`/api/candidates?organizationId=${currentOrg.id}`);
                const candidatesData = candidatesRes.ok ? await candidatesRes.json() : { candidates: [] };

                // Fetch tests
                const testsRes = await fetch(`/api/tests?organizationId=${currentOrg.id}`);
                const testsData = testsRes.ok ? await testsRes.json() : { tests: [] };

                // Calculate stats
                const candidates = candidatesData.candidates || [];
                const tests = testsData.tests || [];

                let activeCount = 0;
                let completedCount = 0;

                candidates.forEach((candidate: any) => {
                    if (candidate.assignments && candidate.assignments.length > 0) {
                        candidate.assignments.forEach((assignment: any) => {
                            if (assignment.status === 'in_progress' || assignment.status === 'pending') {
                                activeCount++;
                            } else if (assignment.status === 'completed') {
                                completedCount++;
                            }
                        });
                    }
                });

                // Calculate recent activity
                const allActivities: any[] = [];

                candidates.forEach((candidate: any) => {
                    // Candidate created
                    allActivities.push({
                        id: `cand-${candidate.id}`,
                        type: 'candidate_added',
                        message: `New candidate added: ${candidate.name}`,
                        timestamp: candidate.createdAt
                    });

                    // Assignments
                    if (candidate.assignments && candidate.assignments.length > 0) {
                        candidate.assignments.forEach((assignment: any) => {
                            // Assignment created
                            if (assignment.test) {
                                allActivities.push({
                                    id: `assign-${assignment.id}`,
                                    type: 'test_assigned',
                                    message: `Assigned "${assignment.test.title}" to ${candidate.name}`,
                                    timestamp: assignment.createdAt
                                });
                            }

                            // Assignment completed
                            if (assignment.status === 'completed' && assignment.completedAt && assignment.test) {
                                allActivities.push({
                                    id: `comp-${assignment.id}`,
                                    type: 'test_completed',
                                    message: `${candidate.name} completed "${assignment.test.title}"`,
                                    timestamp: assignment.completedAt
                                });
                            }
                        });
                    }
                });

                // Sort by timestamp desc and take top 5
                const recentActivity = allActivities
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5);

                setStats({
                    totalCandidates: candidates.length,
                    totalTests: tests.length,
                    activeAssignments: activeCount,
                    completedAssignments: completedCount,
                    recentActivity: recentActivity
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentOrg]);

    if (!currentOrg) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-md">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Organization Selected</h3>
                    <p className="text-yellow-700">Please select an organization from the top bar to view your dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
                    <p className="text-gray-600">Overview of your recruitment activities</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                <span className="text-gray-700 font-medium">Loading dashboard...</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Total Candidates */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Users className="h-6 w-6 text-gray-700" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">Total</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</p>
                                    <p className="text-sm text-gray-600 mt-1">Candidates</p>
                                </div>
                            </div>

                            {/* Total Tests */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <TestTube className="h-6 w-6 text-gray-700" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">Created</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
                                    <p className="text-sm text-gray-600 mt-1">Tests</p>
                                </div>
                            </div>

                            {/* Active Assignments */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-yellow-50 rounded-lg">
                                        <Clock className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">In Progress</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeAssignments}</p>
                                    <p className="text-sm text-gray-600 mt-1">Active Tests</p>
                                </div>
                            </div>

                            {/* Completed Assignments */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">Finished</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.completedAssignments}</p>
                                    <p className="text-sm text-gray-600 mt-1">Completed</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Quick Actions Card */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Activity className="h-5 w-5 text-gray-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                                        <p className="text-sm text-gray-500">Common tasks</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/interviewer/tests/new')}
                                        className="w-full flex items-center justify-between px-4 py-3 text-white rounded-lg bg-primary hover:bg-primary/90 transition-all"
                                    >
                                        <span className="font-medium">Create New Test</span>
                                        <TestTube className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/interviewer/candidates')}
                                        className="w-full flex items-center justify-between px-4 py-3 text-white rounded-lg bg-primary hover:bg-primary/90 transition-all"
                                    >
                                        <span className="font-medium">View Candidates</span>
                                        <Users className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/interviewer/tests')}
                                        className="w-full flex items-center justify-between px-4 py-3 text-white rounded-lg bg-primary hover:bg-primary/90 transition-all"
                                    >
                                        <span className="font-medium">Manage Tests</span>
                                        <BarChart3 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Overview Card */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-gray-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                                        <p className="text-sm text-gray-500">Recruitment summary</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Completion Rate</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {(stats.activeAssignments + stats.completedAssignments) > 0
                                                ? Math.round((stats.completedAssignments / (stats.activeAssignments + stats.completedAssignments)) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Active Rate</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {(stats.activeAssignments + stats.completedAssignments) > 0
                                                ? Math.round((stats.activeAssignments / (stats.activeAssignments + stats.completedAssignments)) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Avg Tests per Candidate</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {stats.totalCandidates > 0
                                                ? ((stats.activeAssignments + stats.completedAssignments) / stats.totalCandidates).toFixed(1)
                                                : '0.0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Empty State for Recent Activity */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                                    <p className="text-sm text-gray-500">Latest updates</p>
                                </div>
                            </div>

                            {stats.recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${activity.type === 'test_completed' ? 'bg-green-100 text-green-600' :
                                                activity.type === 'test_assigned' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {activity.type === 'test_completed' ? <CheckCircle className="h-3 w-3" /> :
                                                    activity.type === 'test_assigned' ? <Clock className="h-3 w-3" /> :
                                                        <Users className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No recent activity to display</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
