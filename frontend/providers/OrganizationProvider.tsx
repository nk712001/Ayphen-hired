'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    description: string;
}

interface OrganizationContextType {
    currentOrg: Organization | null;
    organizations: Organization[];
    setCurrentOrg: (org: Organization) => void;
    isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load organizations assigned to this recruiter
    useEffect(() => {
        if (session?.user?.id && session?.user?.role === 'RECRUITER') {
            fetchOrganizations();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    const fetchOrganizations = async () => {
        try {
            // Fetch assignments
            const res = await fetch(`/api/company/recruiters/assignments?recruiterId=${session?.user.id}`);
            if (res.ok) {
                const assignments = await res.json();
                const orgs = assignments.map((a: any) => a.organization);
                setOrganizations(orgs);

                // Restore selection from storage or default to first
                const savedOrgId = localStorage.getItem('selectedOrgId');
                const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);

                if (savedOrg) {
                    setCurrentOrgState(savedOrg);
                } else if (orgs.length > 0) {
                    setCurrentOrgState(orgs[0]);
                    localStorage.setItem('selectedOrgId', orgs[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load organizations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrentOrg = (org: Organization) => {
        setCurrentOrgState(org);
        localStorage.setItem('selectedOrgId', org.id);
        router.refresh();
    };

    return (
        <OrganizationContext.Provider value={{ currentOrg, organizations, setCurrentOrg, isLoading }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};
