'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, Filter, BookOpen } from 'lucide-react';
import ManualQuestionBuilder, { Question } from '@/components/tests/ManualQuestionBuilder';

interface LibraryQuestion {
    id: string;
    type: 'multiple_choice' | 'essay' | 'code';
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category?: string;
    tags?: string; // JSON string array
    metadata: any;
    createdAt: string;
}

export default function QuestionsPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterPlatform, setFilterPlatform] = useState(''); // Mapping "Role" to Category temporarily or Platform? User said Role.
    const [filterRole, setFilterRole] = useState('');
    const [filterSkills, setFilterSkills] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, [filterDifficulty, filterRole, filterSkills]); // Auto-fetch on filter change

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('isLibrary', 'true');
            if (filterDifficulty) params.append('difficulty', filterDifficulty);
            if (filterRole) params.append('category', filterRole);
            if (filterSkills) params.append('tags', filterSkills);

            const res = await fetch(`/api/questions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            // We assume DELETE /api/questions/[id] exists. If not, we might need to create it.
            // Actually, looking at route.ts, only GET and POST exist in /api/questions.
            // I might need to check /api/questions or implement DELETE.
            // Usually deletion is separate route.
            // Let's assume standard REST, but I need to verify deletion endpoint.
            // If it doesn't exist, I'll stick to listing/adding for now and fix delete later.

            // Wait, I saw DELETE /api/assignments/[id] earlier.
            // I should check if /api/questions/[id] exists.

            // For now, let's implement the UI assuming I can add/list.
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const openAddModal = () => {
        setBuilderQuestions([]); // Start empty
        setIsModalOpen(true);
    };

    const handleSaveToLibrary = async () => {
        // We expect 1 question in the builder
        if (builderQuestions.length === 0) return;

        setIsSaving(true);
        try {
            const q = builderQuestions[0];
            // Map ManualQuestionBuilder format to API format
            const payload = {
                text: q.text,
                type: q.type,
                difficulty: q.difficulty,
                metadata: q.metadata,
                isLibrary: true,
                category: 'General' // Could add category field later
            };

            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchQuestions();
            setIsModalOpen(false);
            setBuilderQuestions([]);
        } catch (error) {
            alert('Failed to save question');
        } finally {
            setIsSaving(false);
        }
    };

    // Client-side search for text only
    // const filteredQuestions = questions.filter(q =>
    //     q.text.toLowerCase().includes(search.toLowerCase())
    // );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
                    <p className="text-sm text-gray-500">Manage your reusable library of questions.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
                <div className="flex gap-4">
                    {/* Text Search */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by text..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()} // Search on Enter
                            onBlur={() => fetchQuestions()}
                        />
                    </div>
                    {/* Role Filter */}
                    <div className="w-1/4">
                        <input
                            type="text"
                            placeholder="Job Role / Category"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        />
                    </div>
                    {/* Skills Filter */}
                    <div className="w-1/4">
                        <input
                            type="text"
                            placeholder="Skills / Tags"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={filterSkills}
                            onChange={(e) => setFilterSkills(e.target.value)}
                        />
                    </div>
                    {/* Experience/Difficulty Filter */}
                    <div className="w-1/6">
                        <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value)}
                        >
                            <option value="">All Levels</option>
                            <option value="Easy">Entry (Easy)</option>
                            <option value="Medium">Mid (Medium)</option>
                            <option value="Hard">Senior (Hard)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-4">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-6 py-4 text-center text-gray-500">Loading library...</li>
                    ) : questions.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">No questions found.</li>
                    ) : (
                        questions.map((q) => (
                            <li key={q.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${q.type === 'multiple_choice' ? 'bg-purple-100 text-purple-800' :
                                                        q.type === 'code' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                    {q.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${q.difficulty === 'Easy' ? 'bg-gray-100 text-gray-800' :
                                                        q.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {q.difficulty}
                                                </span>
                                                {q.category && (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {q.category}
                                                    </span>
                                                )}
                                                {q.tags && (() => {
                                                    try {
                                                        const tags = typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags;
                                                        if (Array.isArray(tags)) {
                                                            return tags.map((tag: string, i: number) => (
                                                                <span key={i} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                                    {tag}
                                                                </span>
                                                            ));
                                                        }
                                                        return null;
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 break-words whitespace-pre-wrap">{q.text}</p>
                                            {q.type === 'code' && (
                                                <p className="mt-1 text-xs text-gray-500 font-mono">
                                                    Language: {JSON.parse(q.metadata as string).language}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            {/* 
                         TODO: Implement Edit/Delete
                         <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-900 p-2">
                            <Trash2 className="h-4 w-4" />
                         </button>
                        */}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-white"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-white"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsModalOpen(false)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                            Add Question to Library
                                        </h3>
                                        <div className="mt-2">
                                            {/* Reuse ManualQuestionBuilder for the form logic */}
                                            <ManualQuestionBuilder
                                                questions={builderQuestions}
                                                onQuestionsChange={setBuilderQuestions}
                                                maxQuestions={1} // Force single question mode
                                                suggestedTags={Array.from(new Set(
                                                    questions.flatMap(q => {
                                                        try {
                                                            const t = typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags;
                                                            return Array.isArray(t) ? t : [];
                                                        } catch { return []; }
                                                    })
                                                )).sort()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSaveToLibrary}
                                    disabled={builderQuestions.length === 0 || isSaving}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save to Library'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
