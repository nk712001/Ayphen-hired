import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ClientDashboard from './ClientDashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    if (session.user.role === 'INTERVIEWER' || session.user.role === 'RECRUITER') {
      redirect('/interviewer/dashboard');
    }
    if (session.user.role === 'COMPANY_ADMIN') {
      redirect('/company/dashboard');
    }
  }

  return <ClientDashboard />;
}
