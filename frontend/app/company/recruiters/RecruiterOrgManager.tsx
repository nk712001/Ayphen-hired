'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Organization {
    id: string;
    name: string;
    description?: string;
}

interface Recruiter {
    id: string;
    name: string;
}

interface RecruiterOrgManagerProps {
    recruiter: Recruiter;
    onUpdate?: () => void;
}

export default function RecruiterOrgManager({ recruiter, onUpdate }: RecruiterOrgManagerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [assignedOrgIds, setAssignedOrgIds] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all company organizations
            const orgsRes = await fetch('/api/company/organizations');
            const orgsData = await orgsRes.json();

            // Fetch recruiter's current assignments
            const assignmentsRes = await fetch(`/api/company/recruiters/${recruiter.id}/assignments`);
            const assignmentsData = await assignmentsRes.json();

            setOrganizations(orgsData);
            setAssignedOrgIds(new Set(assignmentsData.map((a: any) => a.organizationId)));
        } catch (error) {
            console.error('Failed to load data', error);
            toast({
                title: "Error",
                description: "Failed to load organizations",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (orgId: string) => {
        const newSet = new Set(assignedOrgIds);
        if (newSet.has(orgId)) {
            newSet.delete(orgId);
        } else {
            newSet.add(orgId);
        }
        setAssignedOrgIds(newSet);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/company/recruiters/${recruiter.id}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationIds: Array.from(assignedOrgIds)
                })
            });

            if (!res.ok) throw new Error('Failed to save assignments');

            toast({
                title: "Success",
                description: "Organization assignments updated",
            });
            setOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save changes",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Access
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Organizations</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Select organizations that <strong>{recruiter.name}</strong> can manage.
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">No organizations found.</p>
                            <p className="text-xs text-gray-400 mt-1">Create organizations first.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {organizations.map((org) => (
                                <div key={org.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <Checkbox
                                        id={`org-${org.id}`}
                                        checked={assignedOrgIds.has(org.id)}
                                        onCheckedChange={() => handleToggle(org.id)}
                                    />
                                    <Label
                                        htmlFor={`org-${org.id}`}
                                        className="flex-1 cursor-pointer flex items-center"
                                    >
                                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium">{org.name}</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
