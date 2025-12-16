'use client';

import { useParams } from 'next/navigation';
import UserManagement from '@/components/company/UserManagement';

export default function CompanyUsersPage() {
  const params = useParams();
  const companyId = params?.id as string;

  return <UserManagement companyId={companyId} />;
}