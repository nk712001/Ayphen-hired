'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Users, Briefcase, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Organization {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    _count: {
        recruiters: number;
        tests: number;
        candidates: number;
    }
}

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const fetchOrgs = async () => {
        try {
            const res = await fetch('/api/company/organizations');
            if (res.ok) {
                const data = await res.json();
                setOrgs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/company/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create organization');

            toast({
                title: "Success",
                description: "Organization created successfully",
            });

            setOpen(false);
            setFormData({ name: '', description: '' });
            fetchOrgs();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create organization",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-500 mt-2">Manage your client entities.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Organization</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. TechCorp Inc."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Client description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                                Create Organization
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="col-span-full text-center text-gray-500 py-8">Loading organizations...</p>
                ) : orgs.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No organizations yet</h3>
                        <p className="text-gray-500 mt-1">Create your first client entity to start hiring.</p>
                    </div>
                ) : (
                    orgs.map((org) => (
                        <Card key={org.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(org.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{org.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{org.description || 'No description provided.'}</p>
                            </div>

                            <div className="border-t border-gray-100 bg-gray-50 p-4 grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-900">{org._count.recruiters}</p>
                                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Recruiters
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-900">{org._count.tests}</p>
                                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Tests
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-900">{org._count.candidates}</p>
                                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                        <Briefcase className="w-3 h-3" />
                                        Candidates
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
