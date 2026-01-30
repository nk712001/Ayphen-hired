'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Home, Users, FileText, Calendar, BookOpen } from 'lucide-react';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface InterviewerNavProps {
  company?: {
    name: string;
    logo?: string | null;
    darkLogo?: string | null;
    primaryColor?: string | null;
  } | null;
}

export default function InterviewerNav({ company }: InterviewerNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/interviewer/dashboard', icon: Home },
    { name: 'Candidates', href: '/interviewer/candidates', icon: Users },
    { name: 'Tests', href: '/interviewer/tests', icon: FileText },
    { name: 'Question Bank', href: '/interviewer/questions', icon: BookOpen },
  ];

  // Determine which logo to show
  const displayLogo = mounted && resolvedTheme === 'dark' && company?.darkLogo
    ? company.darkLogo
    : company?.logo;

  return (
    <nav className="bg-card border-r border-border fixed top-0 left-0 h-full w-64 z-50 flex flex-col">

      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/interviewer/dashboard" className="flex flex-col gap-3">
            {displayLogo ? (
              <Image
                src={displayLogo}
                alt={company?.name || 'Company Logo'}
                width={64}
                height={64}
                className="h-16 w-auto object-contain max-w-full"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {company?.name?.[0] || 'A'}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground truncate max-w-[150px]">{company?.name || 'Ayphen'}</h1>
                  <p className="text-xs text-muted-foreground">Recruiter Portal</p>
                </div>
              </div>
            )}
            {displayLogo && (
              <div>
                <h1 className="text-lg font-bold text-foreground truncate">{company?.name}</h1>
                <p className="text-xs text-muted-foreground">Recruiter Portal</p>
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <div className="mb-2 px-4">
            <ThemeToggle />
          </div>
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">
              {session?.user?.name?.[0] || 'R'}
            </div>
            <div className="ml-3 overflow-hidden">
              <div className="text-sm font-medium text-foreground truncate">{session?.user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/interviewer/login' })}
            className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}