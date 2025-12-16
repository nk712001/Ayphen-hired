'use client';

import { useState, useEffect } from 'react';
import { Users, Building, TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { useBranding } from '@/lib/branding-context';

interface CompanyStats {
  totalUsers: number;
  activeTests: number;
  completedTests: number;
  averageScore: number;
  monthlyGrowth: number;
  upcomingDeadlines: number;
}

const StatCard = ({
  title,
  value,
  icon,
  gradient,
  change,
  changeType
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) => (
  <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-4 rounded-2xl ${gradient} shadow-md`}>
            {icon}
          </div>
          <div className="ml-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${changeType === 'positive' ? 'text-green-600' :
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface CompanyDashboardProps {
  companyId?: string;
}

export default function CompanyDashboard({ companyId }: CompanyDashboardProps) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const branding = useBranding();
  const primaryColor = branding.primaryColor || '#3B82F6';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = companyId ? `/api/company/${companyId}/analytics` : '/api/company/analytics';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching company stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent shadow-lg" style={{ borderColor: `${primaryColor}33`, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  // Helper to create lighter shade of primary color
  const getLightShade = (opacity: number = 0.1) => {
    return `${primaryColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Dashboard</h1>
          <p className="text-gray-600">Monitor your organization&apos;s performance and growth metrics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="h-8 w-8" style={{ color: primaryColor }} />}
            gradient="bg-gradient-to-br"
            change="+12% from last month"
            changeType="positive"
          />
          <StatCard
            title="Active Tests"
            value={stats?.activeTests || 0}
            icon={<Target className="h-8 w-8 text-green-600" />}
            gradient="bg-gradient-to-br from-green-50 to-green-100"
            change="+8% from last month"
            changeType="positive"
          />
          <StatCard
            title="Completed Tests"
            value={stats?.completedTests || 0}
            icon={<Award className="h-8 w-8 text-purple-600" />}
            gradient="bg-gradient-to-br from-purple-50 to-purple-100"
            change="+15% from last month"
            changeType="positive"
          />
          <StatCard
            title="Average Score"
            value={`${stats?.averageScore || 0}%`}
            icon={<TrendingUp className="h-8 w-8 text-orange-600" />}
            gradient="bg-gradient-to-br from-orange-50 to-orange-100"
            change="+3% from last month"
            changeType="positive"
          />
          <StatCard
            title="Monthly Growth"
            value={`${stats?.monthlyGrowth || 0}%`}
            icon={<Building className="h-8 w-8 text-indigo-600" />}
            gradient="bg-gradient-to-br from-indigo-50 to-indigo-100"
            change="Steady growth"
            changeType="neutral"
          />
          <StatCard
            title="Upcoming Deadlines"
            value={stats?.upcomingDeadlines || 0}
            icon={<Calendar className="h-8 w-8 text-red-600" />}
            gradient="bg-gradient-to-br from-red-50 to-red-100"
            change="Next 7 days"
            changeType="neutral"
          />
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900">Performance Trends</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Performance chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { action: 'New user onboarded', time: '2 hours ago', type: 'user' },
                  { action: 'Test completed by team', time: '4 hours ago', type: 'test' },
                  { action: 'Monthly report generated', time: '1 day ago', type: 'report' },
                  { action: 'Settings updated', time: '2 days ago', type: 'system' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: activity.type === 'user' ? primaryColor :
                          activity.type === 'test' ? '#10b981' :
                            activity.type === 'report' ? '#a855f7' : '#f97316'
                      }}
                    ></div>
                    <span className="text-gray-900 font-medium flex-1">{activity.action}</span>
                    <span className="text-gray-500 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = `/company/${companyId}/users`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, ${primaryColor}, ${adjustBrightness(primaryColor, -20)})`,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${adjustBrightness(primaryColor, -20)}, ${primaryColor})`;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${primaryColor}, ${adjustBrightness(primaryColor, -20)})`;
                  e.currentTarget.style.color = 'white';
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                Manage Users
              </button>
              <button
                onClick={() => window.location.href = '/interviewer/tests/new'}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Target className="h-5 w-5 mr-2" />
                Create Test
              </button>
              <button
                onClick={() => window.location.href = `/company/${companyId}/analytics`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const clamp = (num: number) => Math.min(Math.max(num, 0), 255);
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}