'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Users, Target, Award, TrendingUp } from 'lucide-react';

interface AnalyticsStats {
  totalUsers: number;
  activeTests: number;
  completedTests: number;
  averageScore: number;
}

export default function CompanyAnalyticsPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  useEffect(() => {
    fetch(`/api/company/${companyId}/analytics`)
      .then(res => res.json())
      .then(data => setStats(data));
  }, [companyId]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tests</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeTests || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Tests</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedTests || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageScore || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Performance chart will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-lg font-semibold mb-4">User Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">New registrations</span>
              <span className="text-sm text-gray-600">+12 this week</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Tests completed</span>
              <span className="text-sm text-gray-600">+8 this week</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Average session time</span>
              <span className="text-sm text-gray-600">24 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}