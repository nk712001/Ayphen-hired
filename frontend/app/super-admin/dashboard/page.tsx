import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
    Building2,
    Users,
    FileText,
    Activity,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getPlatformStats() {
    const [
        totalCompanies,
        totalUsers,
        totalTests,
        activeCompanies,
        recentAuditLogs
    ] = await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.test.count(),
        prisma.company.count({ where: { subscriptionStatus: 'active' } }),
        prisma.auditLog.findMany({
            take: 5,
            orderBy: { timestamp: 'desc' },
            include: { user: true, company: true }
        })
    ]);

    return {
        totalCompanies,
        totalUsers,
        totalTests,
        activeCompanies,
        recentAuditLogs
    };
}

export default async function SuperAdminDashboard() {
    const stats = await getPlatformStats();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-gray-500 mt-2">Monitor system health and tenant activity across the platform.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Tenants</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCompanies}</h3>
                            <p className="text-xs text-green-600 mt-1 flex items-center font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {stats.activeCompanies} Active
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</h3>
                            <p className="text-xs text-gray-400 mt-1">Across all tenants</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Tests</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTests}</h3>
                            <p className="text-xs text-gray-400 mt-1">Global hiring activity</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Link href="/super-admin/health">
                    <Card className="p-6 border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">System Health</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">Check</h3>
                                <p className="text-xs text-blue-600 mt-1 font-medium">View Detailed Status</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Recent Audit Logs Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200">Audit Log</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats.recentAuditLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No recent activity found.
                        </div>
                    ) : (
                        stats.recentAuditLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                                        <span className="text-xs text-gray-300">•</span>
                                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Performed by <span className="font-medium text-gray-900">{log.user.name}</span>
                                        {log.company && <span> in <span className="font-medium text-gray-900">{log.company.name}</span></span>}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
