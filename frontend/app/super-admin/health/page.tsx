
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import {
    Activity,
    Database,
    Server,
    Cpu,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';

async function checkDatabase() {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', latency: Date.now() - start };
    } catch (e) {
        console.error('Database health check failed:', e);
        return { status: 'unhealthy', latency: 0, error: 'Connection failed' };
    }
}

import https from 'https';

async function checkAIService() {
    try {
        const url = process.env.AI_SERVICE_URL || 'https://127.0.0.1:8000';
        const start = Date.now();

        // Agent to ignore self-signed certs
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Use a short timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${url}/health`, {
            signal: controller.signal,
            cache: 'no-store',
            // @ts-ignore - Next.js fetch extends RequestInit but types might warn
            agent: agent
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            return { status: 'healthy', latency: Date.now() - start };
        }
        return { status: 'unhealthy', latency: Date.now() - start, error: `Status ${res.status}` };
    } catch (e) {
        console.error('AI API health check failed:', e);
        return { status: 'unhealthy', latency: 0, error: 'Unreachable' };
    }
}

export default async function HealthPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        redirect('/auth/login');
    }

    const [dbHealth, aiHealth] = await Promise.all([
        checkDatabase(),
        checkAIService()
    ]);

    const services = [
        {
            name: 'Database (PostgreSQL)',
            icon: Database,
            ...dbHealth,
            description: 'Primary data store for users, companies, and tests.'
        },
        {
            name: 'AI Proctoring Service',
            icon: Cpu,
            ...aiHealth,
            description: 'Python backend for gaze tracking and object detection.'
        },
        {
            name: 'Frontend Application',
            icon: Server,
            status: 'healthy',
            latency: 0, // negligible
            description: 'Next.js server rendering UI and handling API routes.'
        }
    ];

    const allHealthy = services.every(s => s.status === 'healthy');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
                <p className="text-gray-500 mt-2">Real-time status of all platform services and dependencies.</p>
            </div>

            {/* Overall Status */}
            <Card className={`p-6 border-l-4 ${allHealthy ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${allHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {allHealthy ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {allHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Last performed: {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Service Grid */}
            <div className="grid grid-cols-1 gap-6">
                {services.map((service) => (
                    <Card key={service.name} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                    <service.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        {service.name}
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'healthy'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {service.status === 'healthy' ? 'Active' : 'Inactive'}
                                        </span>
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">{service.description}</p>

                                    {service.error && (
                                        <p className="text-red-500 text-xs mt-2 font-medium">Error: {service.error}</p>
                                    )}
                                </div>
                            </div>

                            {service.latency > 0 && (
                                <div className="flex items-center text-xs text-gray-400 font-mono">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {service.latency}ms
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
