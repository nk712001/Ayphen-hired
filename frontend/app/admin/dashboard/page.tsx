'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Users, TestTube, Settings, BarChart3, Shield, MonitorCheck } from 'lucide-react';

const StatsCard = ({ title, value, icon, gradient }: { title: string; value: string; icon: React.ReactNode; gradient: string }) => (
  <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="px-6 py-8">
      <div className="flex items-center">
        <div className={`p-4 rounded-2xl ${gradient} shadow-md`}>
          {icon}
        </div>
        <div className="ml-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const ActionCard = ({ href, title, description, icon, gradient }: { href: string; title: string; description: string; icon: React.ReactNode; gradient: string }) => (
  <Link href={href} className="group">
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${gradient} shadow-md group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name}! Here&apos;s what&apos;s happening today.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            title="Total Users"
            value="256"
            icon={<Users className="h-8 w-8 text-primary" />}
            gradient="bg-gradient-to-br from-primary/10 to-primary/20"
          />
          <StatsCard
            title="Active Tests"
            value="12"
            icon={<TestTube className="h-8 w-8 text-secondary" />}
            gradient="bg-gradient-to-br from-secondary/10 to-secondary/20"
          />
          <StatsCard
            title="Proctoring Sessions"
            value="48"
            icon={<MonitorCheck className="h-8 w-8 text-primary-400" />}
            gradient="bg-gradient-to-br from-primary-50 to-primary-100"
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              href="/admin/users"
              title="Manage Users"
              description="Add, edit, or remove users"
              icon={<Users className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-primary to-primary-400"
            />
            <ActionCard
              href="/admin/tests"
              title="Manage Tests"
              description="Create and manage test content"
              icon={<TestTube className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-secondary to-secondary-400"
            />
            <ActionCard
              href="/admin/proctoring"
              title="Proctoring"
              description="Monitor active sessions"
              icon={<MonitorCheck className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-primary-400 to-primary-500"
            />
            <ActionCard
              href="/admin/analytics"
              title="Analytics"
              description="View test statistics and insights"
              icon={<BarChart3 className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-secondary-400 to-secondary-500"
            />
            <ActionCard
              href="/admin/security"
              title="Security"
              description="Manage security settings"
              icon={<Shield className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-primary-500 to-primary-600"
            />
            <ActionCard
              href="/admin/organizations"
              title="Organizations"
              description="Manage company organizations"
              icon={<Users className="h-6 w-6 text-white" />}
              gradient="bg-gradient-to-br from-secondary-500 to-secondary-600"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 minutes ago', type: 'user' },
                { action: 'Test "Advanced JavaScript" created', time: '1 hour ago', type: 'test' },
                { action: 'Proctoring session completed', time: '3 hours ago', type: 'session' },
                { action: 'System settings updated', time: '5 hours ago', type: 'system' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <div className={`h-3 w-3 rounded-full ${activity.type === 'user' ? 'bg-primary' :
                      activity.type === 'test' ? 'bg-secondary' :
                        activity.type === 'session' ? 'bg-primary-400' : 'bg-secondary-400'
                    }`}></div>
                  <span className="text-gray-900 font-medium flex-1">{activity.action}</span>
                  <span className="text-gray-500 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}