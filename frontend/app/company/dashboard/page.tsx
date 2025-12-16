import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  Users,
  Building2,
  Briefcase,
  UserPlus,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

async function getCompanyStats(companyId: string) {
  const [
    recruitersCount,
    organizationsCount,
    testsCount,
    candidatesCount,
    recentRecruiters
  ] = await Promise.all([
    prisma.user.count({ where: { companyId, role: 'RECRUITER' } }),
    prisma.organization.count({ where: { companyId } }),
    prisma.test.count({ where: { companyId } }),
    prisma.candidate.count({ where: { companyId } }),
    prisma.user.findMany({
      where: { companyId, role: 'RECRUITER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true }
    })
  ]);

  return {
    recruitersCount,
    organizationsCount,
    testsCount,
    candidatesCount,
    recentRecruiters
  };
}

export default async function CompanyDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return null;

  const stats = await getCompanyStats(session.user.companyId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your hiring team and activity.</p>
        </div>
        <Link
          href="/company/recruiters"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Recruiter
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recruiters</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.recruitersCount}</h3>
              <p className="text-xs text-blue-600 mt-1 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Team members
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Organizations</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.organizationsCount}</h3>
              <p className="text-xs text-indigo-600 mt-1 flex items-center">
                <Building2 className="w-3 h-3 mr-1" />
                Client entities
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.testsCount}</h3>
              <p className="text-xs text-purple-600 mt-1 flex items-center">
                <Briefcase className="w-3 h-3 mr-1" />
                Tests created
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Candidates</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.candidatesCount}</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total pool
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Recruiters */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Recruiters</h2>
            <Link href="/company/recruiters" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentRecruiters.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No recruiters yet. Add your first team member!
              </div>
            ) : (
              stats.recentRecruiters.map((recruiter) => (
                <div key={recruiter.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                      {recruiter.name?.substring(0, 1) || 'R'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recruiter.name}</p>
                      <p className="text-sm text-gray-500">{recruiter.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    Added {new Date(recruiter.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/company/recruiters"
              className="group flex items-center p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Add Recruiter</p>
                <p className="text-xs text-gray-500">Invite new team member</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              href="/company/organizations"
              className="group flex items-center p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">New Organization</p>
                <p className="text-xs text-gray-500">Create client entity</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-indigo-600 transition-colors" />
            </Link>

            <Link
              href="/company/jobs"
              className="group flex items-center p-3 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">View Jobs</p>
                <p className="text-xs text-gray-500">Manage open positions</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}