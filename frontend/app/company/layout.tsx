import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  LogOut,
  Briefcase
} from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';
import { BrandingProvider } from '@/components/BrandingProvider';

export default async function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
    redirect('/auth/login');
  }

  // Fetch company details for branding
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true, primaryColor: true, logo: true }
  });

  const primaryColor = company?.primaryColor || '#3B82F6';

  const navigation = [
    { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
    { name: 'Recruiters', href: '/company/recruiters', icon: Users },
    { name: 'Organizations', href: '/company/organizations', icon: Building2 },
    { name: 'Jobs & Tests', href: '/company/jobs', icon: Briefcase },
    { name: 'Settings', href: '/company/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <BrandingProvider primaryColor={primaryColor} />
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col gap-3">
            {company?.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="h-20 w-auto object-contain max-w-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {company?.name.substring(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {company?.name}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <item.icon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
              {session.user.name?.substring(0, 1) || 'A'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton className="flex items-center w-full px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </SignOutButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {children}
      </div>
    </div>
  );
}