'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Building2, User, Mail, Lock, Globe, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function CompanySignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        domain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/company/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Login automatically or redirect to login
            router.push('/auth/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Building2 className="w-6 h-6" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your company workspace
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Start hiring with a dedicated portal for your team
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10 border-none">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                                Company Name
                            </Label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="companyName"
                                    required
                                    className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Acme Corp"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                                Website Domain (Optional)
                            </Label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="domain"
                                    className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="acme.com"
                                    value={formData.domain}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Admin Account</h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </Label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="name"
                                            required
                                            className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="John Doe"
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Work Email
                                    </Label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="john@acme.com"
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </Label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="••••••••"
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating workspace...
                                    </>
                                ) : (
                                    <>
                                        Create Workspace
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/auth/login"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Sign in to your workspace
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
