import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
    LayoutDashboard,
    Building2,
    ShieldAlert,
    BarChart3,
    Activity,
    LogOut
} from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        redirect('/auth/login');
    }

    const navigation = [
        { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
        { name: 'Companies', href: '/super-admin/companies', icon: Building2 },
        { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ShieldAlert },
        { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
        { name: 'System Health', href: '/super-admin/health', icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-center items-center w-full">
                        <Image
                            src="/ayphen-logo.png"
                            alt="Ayphen"
                            width={200}
                            height={64}
                            className="h-16 w-auto object-contain"
                        />
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
                            {(session.user.name?.[0] || 'A').toUpperCase()}
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
