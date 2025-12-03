'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function InterviewerNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/interviewer/dashboard', label: 'Dashboard' },
    { href: '/interviewer/interviews', label: 'Interviews' },
    { href: '/interviewer/candidates', label: 'Candidates' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/interviewer/dashboard" 
                className="text-xl font-bold text-gray-800 hover:text-primary transition-colors"
              >
                Ayphen Hire
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link
                href="/api/auth/signout"
                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
