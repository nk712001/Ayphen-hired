'use client';

import { useSession } from 'next-auth/react';
import UserManagement from '@/components/company/UserManagement';

export default function CompanyUsersPage() {
  const { data: session } = useSession();

  if (!session?.user?.companyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No company associated with your account.</p>
      </div>
    );
  }

  return <UserManagement companyId={session.user.companyId} />;
}