'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2 } from 'lucide-react';

export default function CreateCompanyDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        adminEmail: '',
        adminName: '',
        adminPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/super-admin/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create company');
            }

            setOpen(false);
            setFormData({
                name: '',
                domain: '',
                adminEmail: '',
                adminName: '',
                adminPassword: ''
            });
            router.refresh();
        } catch (error) {
            console.error('Error creating company:', error);
            alert('Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Create Company
            </Button>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="sm:max-w-md">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <DrawerHeader>
                            <div className="flex items-center justify-between w-full">
                                <DrawerTitle>Create New Company</DrawerTitle>
                                <DrawerClose />
                            </div>
                            <DrawerDescription>
                                Add a new tenant to the platform. This will create a company workspace and an initial admin user.
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Acme Corp"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="domain">Domain</Label>
                                <Input
                                    id="domain"
                                    value={formData.domain}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    placeholder="acme.com"
                                    required
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Initial Admin User</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="adminName">Full Name</Label>
                                        <Input
                                            id="adminName"
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminEmail">Email Address</Label>
                                        <Input
                                            id="adminEmail"
                                            type="email"
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                            placeholder="admin@acme.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminPassword">Password</Label>
                                        <Input
                                            id="adminPassword"
                                            type="password"
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DrawerFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-pink-300 text-pink-600 hover:bg-pink-50">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white border-none">
                                {loading ? 'Creating...' : 'Create Company'}
                            </Button>
                        </DrawerFooter>
                    </form>
                </DrawerContent>
            </Drawer>
        </>
    );
}
