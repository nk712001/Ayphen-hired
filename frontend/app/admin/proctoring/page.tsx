'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Camera, Mic, Clock, User } from 'lucide-react';

interface Violation {
    id: string;
    type: string;
    severity: string;
    description: string | null;
    timestamp: string;
    evidenceUrl: string | null;
    cameraSource: string | null;
    status: string;
}

interface ProctorSession {
    id: string;
    startedAt: string;
    endedAt: string | null;
    primaryCameraActive: boolean;
    secondaryCameraActive: boolean;
    secondaryCameraRequired: boolean;
    microphoneActive: boolean;
    testAssignment: {
        id: string;
        status: string;
        candidate: {
            id: string;
            name: string;
            email: string;
        };
        test: {
            id: string;
            title: string;
        };
    };
    violations: Violation[];
}

interface Stats {
    totalSessions: number;
    activeSessions: number;
    totalViolations: number;
    criticalViolations: number;
    majorViolations: number;
    minorViolations: number;
}

export default function AdminProctoringPage() {
    const [sessions, setSessions] = useState<ProctorSession[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        fetchProctoringData();
    }, []);

    const fetchProctoringData = async () => {
        try {
            const response = await fetch('/api/admin/proctoring');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching proctoring data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (filter === 'active') return !session.endedAt;
        if (filter === 'completed') return session.endedAt;
        return true;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'MAJOR': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MINOR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getViolationIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <XCircle className="h-4 w-4" />;
            case 'MAJOR': return <AlertTriangle className="h-4 w-4" />;
            default: return <Eye className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">Proctoring Monitoring</h1>
                    </div>
                    <p className="text-gray-600">Monitor test proctoring sessions and violations in real-time</p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Sessions</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                                </div>
                                <Shield className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Violations</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalViolations}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-gray-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 border border-red-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Critical</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.criticalViolations}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 border border-orange-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Major</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.majorViolations}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 border border-yellow-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Minor</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.minorViolations}</p>
                                </div>
                                <Eye className="h-8 w-8 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            style={filter === 'all' ? { color: 'white' } : {}}
                        >
                            All Sessions
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            style={filter === 'active' ? { color: 'white' } : {}}
                        >
                            Active Only
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            style={filter === 'completed' ? { color: 'white' } : {}}
                        >
                            Completed Only
                        </button>
                    </div>
                </div>

                {/* Sessions List */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading proctoring sessions...</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h3>
                        <p className="text-gray-600">No proctoring sessions match your filter criteria</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((session) => (
                            <div key={session.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                <div className="p-6">
                                    {/* Session Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {session.testAssignment.candidate.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{session.testAssignment.candidate.email}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Test: {session.testAssignment.test.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {!session.endedAt ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Camera and Mic Status */}
                                    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Camera className={`h-5 w-5 ${session.primaryCameraActive ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className="text-sm text-gray-700">Primary Camera</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Camera className={`h-5 w-5 ${session.secondaryCameraActive ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className="text-sm text-gray-700">Secondary Camera</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Mic className={`h-5 w-5 ${session.microphoneActive ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className="text-sm text-gray-700">Microphone</span>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-auto">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                Started: {new Date(session.startedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Violations */}
                                    {session.violations.length > 0 ? (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                Violations ({session.violations.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {session.violations.slice(0, 5).map((violation) => (
                                                    <div
                                                        key={violation.id}
                                                        className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(violation.severity)}`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            {getViolationIcon(violation.severity)}
                                                            <div>
                                                                <p className="text-sm font-medium">{violation.type.replace('_', ' ').toUpperCase()}</p>
                                                                {violation.description && (
                                                                    <p className="text-xs opacity-80">{violation.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-medium">{violation.severity}</p>
                                                            <p className="text-xs opacity-70">
                                                                {new Date(violation.timestamp).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {session.violations.length > 5 && (
                                                    <p className="text-sm text-gray-600 text-center">
                                                        +{session.violations.length - 5} more violations
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-sm text-green-800 font-medium">No violations detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
