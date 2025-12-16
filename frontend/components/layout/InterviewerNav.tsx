'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Home, Users, FileText, Calendar, BookOpen } from 'lucide-react';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';

interface InterviewerNavProps {
  company?: {
    name: string;
    logo?: string | null;
    primaryColor?: string | null;
  } | null;
}

export default function InterviewerNav({ company }: InterviewerNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/interviewer/dashboard', icon: Home },
    { name: 'Candidates', href: '/interviewer/candidates', icon: Users },
    { name: 'Tests', href: '/interviewer/tests', icon: FileText },
    { name: 'Question Bank', href: '/interviewer/questions', icon: BookOpen },
  ];

  return (
    <nav className="bg-white border-r border-gray-200 fixed top-0 left-0 h-full w-64 z-50 flex flex-col">

      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/interviewer/dashboard" className="flex flex-col gap-3">
            {company?.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                width={64}
                height={64}
                className="h-16 w-auto object-contain max-w-full"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                  {company?.name?.[0] || 'A'}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{company?.name || 'Ayphen'}</h1>
                  <p className="text-xs text-gray-500">Recruiter Portal</p>
                </div>
              </div>
            )}
            {company?.logo && (
              <div>
                <h1 className="text-lg font-bold text-gray-900 truncate">{company.name}</h1>
                <p className="text-xs text-gray-500">Recruiter Portal</p>
              </div>
            )}
          </Link>
        </div>

        {/* Organization Switcher */}
        <div className="px-4 pb-4">
          <OrganizationSwitcher />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
              {session?.user?.name?.[0] || 'R'}
            </div>
            <div className="ml-3 overflow-hidden">
              <div className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/interviewer/login' })}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}