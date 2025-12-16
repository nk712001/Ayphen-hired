'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/auth/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return null;
  }

  if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex">
        {/* Modern Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20 flex flex-col fixed h-full overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5"></div>
          <div className="absolute top-10 right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-4 w-16 h-16 bg-secondary/10 rounded-full blur-lg animate-bounce" style={{ animationDelay: '2s' }}></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100/50">
              <Link href="/admin/dashboard" className="flex items-center justify-center hover:scale-105 transition-all duration-300">
                <img
                  src="/ayphen-logo.png"
                  alt="Ayphen Logo"
                  className="h-12 w-full max-w-[200px] object-contain"
                />
              </Link>
            </div>
            <nav className="mt-6 flex-1 px-4">
              <div className="space-y-3">
                <Link href="/admin/dashboard" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">📊</span>
                  </div>
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/admin/users" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">👥</span>
                  </div>
                  <span className="font-medium">Users</span>
                </Link>
                <Link href="/admin/tests" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">📝</span>
                  </div>
                  <span className="font-medium">Tests</span>
                </Link>
                <Link href="/admin/organizations" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">🏢</span>
                  </div>
                  <span className="font-medium">Organizations</span>
                </Link>
                <Link href="/admin/consultancy" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">📈</span>
                  </div>
                  <span className="font-medium">Consultancy</span>
                </Link>
                <Link href="/admin/analytics" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">📊</span>
                  </div>
                  <span className="font-medium">Analytics</span>
                </Link>
                <Link href="/admin/security" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">🔒</span>
                  </div>
                  <span className="font-medium">Security</span>
                </Link>
                <Link href="/admin/settings" className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/60 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/20">
                  <div className="w-8 h-8 mr-4 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
                    <span className="text-lg">⚙️</span>
                  </div>
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </nav>
            <div className="p-4 border-t border-white/20">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary-400 to-secondary rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-semibold">{session.user.name?.[0]}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{session.user.name}</div>
                      <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/admin/login' })}
                    className="flex items-center text-gray-400 hover:text-red-500 transition-all duration-200 p-2 rounded-xl hover:bg-red-50 hover:shadow-md"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 ml-64">
          {children}
        </div>
      </div>
    );
  }

  return null;
}