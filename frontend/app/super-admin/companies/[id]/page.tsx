import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    Building2,
    Users,
    Calendar,
    Shield,
    Activity,
    ArrowLeft
} from 'lucide-react';

async function getCompanyDetails(id: string) {
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            users: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    users: true,
                    organizations: true,
                    tests: true,
                    candidates: true
                }
            }
        }
    });

    if (!company) return null;
    return company;
}

export default async function CompanyDetailsPage({ params }: { params: { id: string } }) {
    const company = await getCompanyDetails(params.id);

    if (!company) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/super-admin/companies"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <div className="flex items-center gap-3 text-gray-500 mt-1">
                        <span className="flex items-center gap-1 text-sm">
                            <Building2 className="w-4 h-4" />
                            {company.domain || 'No domain'}
                        </span>
                        <span>•</span>
                        <span className="text-sm">
                            Created {new Date(company.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-2xl font-bold mt-1">{company._count.users}</h3>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Tests Created</p>
                            <h3 className="text-2xl font-bold mt-1">{company._count.tests}</h3>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Candidates</p>
                            <h3 className="text-2xl font-bold mt-1">{company._count.candidates}</h3>
                        </div>
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Subscription</p>
                            <h3 className="text-lg font-bold mt-1 uppercase text-blue-600">
                                {company.subscriptionTier}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {company.users.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No users found in this company.
                        </div>
                    ) : (
                        company.users.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="font-medium text-gray-600">
                                            {user.name?.[0] || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={user.role === 'COMPANY_ADMIN' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                    <span className="text-sm text-gray-400">
                                        Joined {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
