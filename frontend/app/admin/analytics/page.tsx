'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, Target, Award, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalTests: number;
  completedTests: number;
  activeUsers: number;
  monthlyGrowth: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching admin analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            System Analytics
          </h1>
          <p className="text-gray-600">Comprehensive overview of platform performance and usage</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                    <p className="text-sm text-green-600 mt-1">+12% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-md">
                    <Building2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Companies</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalCompanies || 0}</p>
                    <p className="text-sm text-green-600 mt-1">+8% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Tests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalTests || 0}</p>
                    <p className="text-sm text-green-600 mt-1">+15% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                    <Award className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Completed Tests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.completedTests || 0}</p>
                    <p className="text-sm text-green-600 mt-1">+22% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md">
                    <Activity className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.activeUsers || 0}</p>
                    <p className="text-sm text-green-600 mt-1">+5% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 shadow-md">
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Monthly Growth</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.monthlyGrowth || 0}%</p>
                    <p className="text-sm text-green-600 mt-1">Steady growth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-primary" />
                Platform Usage Trends
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Usage trends chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-3 text-secondary" />
                Recent System Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { action: 'New company registered', time: '2 hours ago', type: 'company' },
                  { action: 'Test completed by user', time: '4 hours ago', type: 'test' },
                  { action: 'System backup completed', time: '6 hours ago', type: 'system' },
                  { action: 'New interviewer onboarded', time: '1 day ago', type: 'user' },
                  { action: 'Monthly report generated', time: '2 days ago', type: 'report' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <div className={`h-3 w-3 rounded-full ${
                      activity.type === 'company' ? 'bg-blue-500' :
                      activity.type === 'test' ? 'bg-green-500' :
                      activity.type === 'system' ? 'bg-purple-500' :
                      activity.type === 'user' ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-gray-900 font-medium flex-1">{activity.action}</span>
                    <span className="text-gray-500 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-primary" />
              Performance Metrics
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">98.5%</div>
                <div className="text-sm text-gray-600 mt-1">System Uptime</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-2xl font-bold text-green-600">1.2s</div>
                <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">85%</div>
                <div className="text-sm text-gray-600 mt-1">Test Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">4.8/5</div>
                <div className="text-sm text-gray-600 mt-1">User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}