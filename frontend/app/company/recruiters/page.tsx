'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Mail, Lock, Building2, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RecruiterOrgManager from './RecruiterOrgManager';

interface Recruiter {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    _count: {
        recruiterOrgs: number;
        createdTests: number;
    }
}

export default function RecruitersPage() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const fetchRecruiters = async () => {
        try {
            const res = await fetch('/api/company/recruiters');
            if (res.ok) {
                const data = await res.json();
                setRecruiters(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecruiters();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/company/recruiters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create recruiter');

            toast({
                title: "Success",
                description: "Recruiter account created successfully",
            });

            setOpen(false);
            setFormData({ name: '', email: '', password: '' });
            fetchRecruiters();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create recruiter. Email might be in use.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Recruiters</h1>
                    <p className="text-gray-500 mt-2">Manage your hiring team.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add Recruiter
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Recruiter</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Initial Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                                Create Account
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading team...</p>
                ) : recruiters.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No recruiters yet</h3>
                        <p className="text-gray-500 mt-1">Add your first team member to start hiring.</p>
                    </div>
                ) : (
                    recruiters.map((recruiter) => (
                        <Card key={recruiter.id} className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                        {recruiter.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{recruiter.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            {recruiter.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">{recruiter._count.recruiterOrgs}</p>
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            Organizations
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">{recruiter._count.createdTests}</p>
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            Tests
                                        </p>
                                    </div>
                                    <RecruiterOrgManager
                                        recruiter={recruiter}
                                        onUpdate={fetchRecruiters}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
