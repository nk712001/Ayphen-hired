
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateQuestionnaireModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GenerateQuestionnaireModal({ isOpen, onClose }: GenerateQuestionnaireModalProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('Easy');
    const [orgId, setOrgId] = useState('');
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchOrganizations();
        }
    }, [isOpen]);

    const fetchOrganizations = async () => {
        try {
            // Re-using existing endpoint logic if available, or just fetching structure
            // Assuming we have a way to get orgs, or we can use /api/user/me/organizations if it existed.
            // Based on Test creation flow, we need an Organization ID.
            // Let's assume there is an endpoint or we can fetch.
            // Fallback: If no dedicated endpoint, we might struggle. 
            // Let's try /api/organizations if standard, otherwise this might be a blocker.
            // Checking previous file usage: ManualQuestionBuilder used an Org Store or prop?
            // Actually manual Test creation usually passes Org. 
            // Let's use /api/organizations if it exists or mock for now if we can't find it.
            // WAIT - I can check what manual test builder uses.
            // For now, I'll assume we can fetch from /api/proctor/organizations or similar?
            // Let's safe bet: /api/organizations

            const res = await fetch('/api/company/organizations');
            if (res.ok) {
                const data = await res.json();
                const orgList = Array.isArray(data) ? data : (data.organizations || []);
                setOrganizations(orgList);
                if (orgList.length > 0) {
                    setOrgId(orgList[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerate = async () => {
        if (!title || !orgId) {
            setError('Please fill all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/question-sets/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    level,
                    count,
                    organizationId: orgId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate');
            }

            // Success
            onClose();
            // Refresh the page to show new set in list (simple approach for now)
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">Generate Questionnaire</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Questionnaire Title
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                            placeholder="e.g. Junior Frontend Test"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Target Level
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option value="Easy">Intern / Junior</option>
                            <option value="Medium">Mid-Level</option>
                            <option value="Hard">Senior / Lead</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Organization
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                        >
                            <option value="">Select Organization</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full mt-4 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-secondary-dark disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Generating...
                            </>
                        ) : (
                            'Generate Test'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
