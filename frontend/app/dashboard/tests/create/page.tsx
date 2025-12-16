import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import TestCreationForm from '@/components/tests/TestCreationForm'; // Identifying if this component exists or needs creation

async function getOrganizations(companyId: string) {
    return await prisma.organization.findMany({
        where: { companyId },
        select: { id: true, name: true }
    });
}

export default async function CreateTestPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) redirect('/auth/login');

    const organizations = await getOrganizations(session.user.companyId);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
                <p className="text-gray-500 mt-2">Set up a new assessment and job position.</p>
            </div>

            <Card className="p-6">
                <TestCreationForm
                    organizations={organizations}
                    userId={session.user.id}
                />
            </Card>
        </div>
    );
}
