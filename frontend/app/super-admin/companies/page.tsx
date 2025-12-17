import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Building2, Users, Calendar, MoreHorizontal } from 'lucide-react';
import CreateCompanyDialog from '@/components/super-admin/CreateCompanyDialog';

export const dynamic = 'force-dynamic';

async function getCompanies() {
    return await prisma.company.findMany({
        include: {
            _count: {
                select: { users: true, organizations: true, tests: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export default async function CompaniesPage() {
    const companies = await getCompanies();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500 mt-2">Manage platform tenants.</p>
                </div>

                <CreateCompanyDialog />
            </div>

            <div className="grid gap-4">
                {companies.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No companies yet</h3>
                        <p className="text-gray-500 mt-1">Companies created via signup will appear here.</p>
                    </div>
                ) : (
                    companies.map((company: any) => (
                        <Card key={company.id} className="p-6 transition-all hover:shadow-md bg-white border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-blue-600"
                                    >
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{company.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {company._count.users} Users
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-4 h-4" />
                                                {company._count.organizations} Orgs
                                            </span>
                                            <span>•</span>
                                            <span className="text-gray-400">
                                                {new Date(company.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant={
                                        company.subscriptionStatus === 'active' ? 'default' :
                                            company.subscriptionStatus === 'trial' ? 'secondary' : 'destructive'
                                    } className={
                                        company.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' :
                                            company.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
                                    }>
                                        {company.subscriptionStatus.toUpperCase()}
                                    </Badge>

                                    <Link
                                        href={`/super-admin/companies/${company.id}`}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
