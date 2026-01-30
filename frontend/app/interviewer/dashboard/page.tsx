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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-8 text-center max-w-md">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">No Organization Selected</h3>
                    <p className="text-yellow-700 dark:text-yellow-300">Please select an organization from the top bar to view your dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your recruitment activities</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="bg-card rounded-lg p-8 shadow-sm border border-border">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                                <span className="text-foreground font-medium">Loading dashboard...</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Total Candidates */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Users className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Total</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.totalCandidates}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Candidates</p>
                                </div>
                            </div>

                            {/* Total Tests */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <TestTube className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Created</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.totalTests}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Tests</p>
                                </div>
                            </div>

                            {/* Active Assignments */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.activeAssignments}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Active Tests</p>
                                </div>
                            </div>

                            {/* Completed Assignments */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Finished</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.completedAssignments}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Completed</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Quick Actions Card */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Activity className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">Quick Actions</h2>
                                        <p className="text-sm text-muted-foreground">Common tasks</p>
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
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">Overview</h2>
                                        <p className="text-sm text-muted-foreground">Recruitment summary</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-border">
                                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                                        <span className="text-sm font-semibold">
                                            {(stats.activeAssignments + stats.completedAssignments) > 0
                                                ? Math.round((stats.completedAssignments / (stats.activeAssignments + stats.completedAssignments)) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-border">
                                        <span className="text-sm text-muted-foreground">Active Rate</span>
                                        <span className="text-sm font-semibold">
                                            {(stats.activeAssignments + stats.completedAssignments) > 0
                                                ? Math.round((stats.activeAssignments / (stats.activeAssignments + stats.completedAssignments)) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Avg Tests per Candidate</span>
                                        <span className="text-sm font-semibold">
                                            {stats.totalCandidates > 0
                                                ? ((stats.activeAssignments + stats.completedAssignments) / stats.totalCandidates).toFixed(1)
                                                : '0.0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm border border-border">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                                    <p className="text-sm text-muted-foreground">Latest updates</p>
                                </div>
                            </div>

                            {stats.recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-border last:border-0 last:pb-0">
                                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${activity.type === 'test_completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                    activity.type === 'test_assigned' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {activity.type === 'test_completed' ? <CheckCircle className="h-3 w-3" /> :
                                                    activity.type === 'test_assigned' ? <Clock className="h-3 w-3" /> :
                                                        <Users className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {activity.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No recent activity to display</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
