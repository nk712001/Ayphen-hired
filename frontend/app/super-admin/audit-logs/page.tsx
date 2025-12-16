import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldAlert,
    User,
    Clock,
    Activity,
    Search
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAuditLogs() {
    const logs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: {
            user: {
                select: { name: true, email: true, role: true }
            }
        }
    });

    return logs.map(log => ({
        ...log,
        createdAt: log.timestamp, // Map timestamp to createdAt for component compatibility
        actor: log.user // Map user to actor
    }));
}

function getActionColor(action: string) {
    if (action.includes('DELETE')) return 'destructive';
    if (action.includes('CREATE')) return 'default'; // Using default for green/blue typically
    if (action.includes('UPDATE')) return 'secondary';
    return 'outline';
}

export default async function AuditLogsPage() {
    const logs = await getAuditLogs();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500 mt-2">Track system-wide security events and actions.</p>
                </div>
            </div>

            <Card className="border border-gray-200 shadow-sm bg-white">
                <div className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
                            <p className="text-gray-500 mt-1">System activity will appear here.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center ${log.action.includes('DELETE') ? 'bg-red-100 text-red-600' :
                                            log.action.includes('CREATE') ? 'bg-green-100 text-green-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{log.action}</span>
                                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                                                    {log.entityType}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium text-gray-900">
                                                    {log.actor.name || log.actor.email}
                                                </span>
                                                {' '}performed action on{' '}
                                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded border border-gray-200">
                                                    {log.entityId}
                                                </span>
                                            </p>
                                            {log.metadata && (
                                                <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-w-xl">
                                                    {JSON.stringify(JSON.parse(log.metadata as string), null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-400">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {new Date(log.createdAt).toLocaleString()}
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
