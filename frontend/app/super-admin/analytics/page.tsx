
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
export const dynamic = 'force-dynamic';
import {
    BarChart3,
    TrendingUp,
    Users,
    Building2,
    FileCheck
} from 'lucide-react';

async function getAnalytics() {
    const [
        totalCompanies,
        totalUsers,
        totalTests,
        totalCandidates,
        recentTests
    ] = await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.test.count(),
        prisma.candidate.count(),
        prisma.test.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { name: true } },
                _count: { select: { assignments: true } }
            }
        })
    ]);

    // Map the results to match the expected format if needed, OR just return data and adjust the component
    const formattedRecentTests = recentTests.map(test => ({
        ...test,
        _count: {
            candidates: test._count.assignments
        }
    }));

    return {
        totalCompanies,
        totalUsers,
        totalTests,
        totalCandidates,
        recentTests: formattedRecentTests
    };
}

export default async function AnalyticsPage() {
    const data = await getAnalytics();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500 mt-2">Platform usage and growth metrics.</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border border-gray-200 shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Companies</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalCompanies}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Active Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalUsers}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Tests Conducted</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalTests}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <FileCheck className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Candidates</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalCandidates}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Test Activity</h3>
                <div className="space-y-6">
                    {data.recentTests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No tests created yet.</p>
                    ) : (
                        data.recentTests.map((test) => (
                            <div key={test.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                <div>
                                    <p className="font-medium text-gray-900">{test.title}</p>
                                    <p className="text-sm text-gray-500">
                                        by <span className="text-gray-700">{test.company.name}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">{test._count.candidates}</p>
                                    <p className="text-xs text-gray-500">Candidates</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
