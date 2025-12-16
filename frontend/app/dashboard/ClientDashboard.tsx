'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MonitorCheck } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

// Sample components for the dashboard
const StatsCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-primary-100 text-primary">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const RecentActivity = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center border-b pb-3 last:border-0 last:pb-0">
          <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
          <div>
            <p className="text-sm font-medium">Activity {i}</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function ClientDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {session?.user?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Total Tests" 
            value="12" 
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>} 
          />
          <StatsCard 
            title="Average Score" 
            value="85%" 
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>} 
          />
          <StatsCard 
            title="Upcoming Tests" 
            value="3" 
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>} 
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Welcome back, {session?.user?.name}!</h2>
              <p className="text-gray-600 mb-4">Here's what's happening with your tests today.</p>
              <div className="bg-primary-50 p-4 rounded-md">
                <p className="text-sm text-primary-700">You have 1 test scheduled for today. Good luck!</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/tests" className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
                  <div className="text-primary mb-2">
                    <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Take a Test</span>
                </Link>
                <Link href="/results" className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
                  <div className="text-green-500 mb-2">
                    <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">View Results</span>
                </Link>
                <Link href="/test/proctoring-demo" className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
                  <div className="text-purple-500 mb-2 flex justify-center">
                    <MonitorCheck className="h-8 w-8" />
                  </div>
                  <span className="text-sm font-medium">Try AI Proctoring Demo</span>
                  <p className="text-xs text-gray-500 mt-1">Experience our AI-powered proctoring system</p>
                </Link>
                <Link href="/setup" className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
                  <div className="text-green-500 mb-2 flex justify-center">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Setup Interview</span>
                  <p className="text-xs text-gray-500 mt-1">Configure camera and microphone for your interview</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RecentActivity />
            
            {/* Profile Summary */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Your Profile</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-xl">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{session?.user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                    {session?.user?.role?.toUpperCase() || 'USER'}
                  </span>
                </div>
              </div>
              <Link 
                href="/profile" 
                className="block w-full text-center mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
