import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InterviewerNav from '@/components/layout/InterviewerNav';
import { OrganizationProvider } from '@/providers/OrganizationProvider';
import { BrandingProvider } from '@/components/BrandingProvider';

export default async function InterviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/interviewer/login');
  }

  if (session.user.role !== 'INTERVIEWER' && session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
    redirect('/auth/login');
  }

  // Robustly fetch company branding using email to ensure we get fresh data
  const user = session.user.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: true }
  }) : null;

  const company = user?.company || null;
  const primaryColor = company?.primaryColor || '#3B82F6';

  return (
    <OrganizationProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <BrandingProvider primaryColor={primaryColor} />
        <InterviewerNav company={company} />
        <main className="flex-1 ml-64">{children}</main>
      </div>
    </OrganizationProvider>
  );
}