'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
}

interface TestCreationFormProps {
    organizations: Organization[];
    userId: string;
}

export default function TestCreationForm({ organizations, userId }: TestCreationFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        jobDescription: '',
        duration: 60,
        requiresSecondaryCamera: false,
        organizationId: organizations.length === 1 ? organizations[0].id : '',
        mcqQuestions: 5,
        conversationalQuestions: 3,
        codingQuestions: 2
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!formData.organizationId) {
                throw new Error('Please select an organization');
            }

            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create test');
            }

            const { test } = await response.json();

            // Trigger AI generation if needed (optional enhancement)
            // For now, redirect to the interviewer/test page or back to jobs
            router.push(`/company/jobs`);
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Organization Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client / Organization
                </label>
                <select
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="">Select an Organization</option>
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.name}
                        </option>
                    ))}
                </select>
                {organizations.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">You must create an organization first.</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title / Test Name
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                </label>
                <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                    placeholder="Paste the job description here to help generate relevant questions..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                        min="10"
                        max="180"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center pt-8">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.requiresSecondaryCamera}
                            onChange={(e) => setFormData({ ...formData, requiresSecondaryCamera: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Require Secondary Camera</span>
                    </label>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Question Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">MCQ</label>
                        <input
                            type="number"
                            value={formData.mcqQuestions}
                            onChange={(e) => setFormData({ ...formData, mcqQuestions: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Conversational</label>
                        <input
                            type="number"
                            value={formData.conversationalQuestions}
                            onChange={(e) => setFormData({ ...formData, conversationalQuestions: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Coding</label>
                        <input
                            type="number"
                            value={formData.codingQuestions}
                            onChange={(e) => setFormData({ ...formData, codingQuestions: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading || organizations.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Creating...' : 'Create Job'}
                </button>
            </div>
        </form>
    );
}
