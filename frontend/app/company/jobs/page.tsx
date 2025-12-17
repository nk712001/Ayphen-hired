import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
    Briefcase,
    Plus,
    Clock,
    Users,
    MoreVertical,
    Search
} from 'lucide-react';

async function getCompanyJobs(companyId: string) {
    const jobs = await prisma.test.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { assignments: true }
            },
            creator: {
                select: { name: true }
            }
        }
    });

    return jobs.map((job: any) => ({
        ...job,
        _count: {
            candidates: job._count.assignments
        }
    }));
}

export default async function CompanyJobsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) redirect('/auth/login');

    const jobs = await getCompanyJobs(session.user.companyId);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
                    <p className="text-gray-500 mt-2">Manage your open positions and assessments.</p>
                </div>
                <Link
                    href="/dashboard/tests/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                </Link>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                            placeholder="Search jobs..."
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {jobs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-6 h-6 text-purple-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                            <p className="text-gray-500 mt-1">Create your first job posting to start hiring.</p>
                            <div className="mt-6">
                                <Link
                                    href="/dashboard/tests/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Job
                                </Link>
                            </div>
                        </div>
                    ) : (
                        jobs.map((job: any) => (
                            <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    {job.duration} mins
                                                </span>
                                                <span className="flex items-center">
                                                    <Users className="w-3.5 h-3.5 mr-1" />
                                                    {job._count.candidates} Candidates
                                                </span>
                                                <span>
                                                    Created by {job.creator.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {/* Avatar placeholders for recent candidates */}
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                                                    {String.fromCharCode(64 + i)}
                                                </div>
                                            ))}
                                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                                                +{job._count.candidates > 3 ? job._count.candidates - 3 : 0}
                                            </div>
                                        </div>
                                        <Link
                                            href={`/interviewer/tests/${job.id}`}
                                            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </Link>
                                        <Link
                                            href={`/interviewer/tests/${job.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
