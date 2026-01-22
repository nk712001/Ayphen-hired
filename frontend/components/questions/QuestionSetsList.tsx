import { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Layers, Hash, Plus, ArrowLeft, Search, CheckSquare, Square, Pencil, X, Save, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import ManualQuestionBuilder, { Question } from '../tests/ManualQuestionBuilder';
import { toast } from 'sonner';

interface QuestionSet {
    id: string;
    title: string;
    description: string;
    level: string;
    createdAt: string;
    _count: {
        questions: number;
    };
}

interface QuestionSetDetails extends QuestionSet {
    questions: Question[];
}

export default function QuestionSetsList() {
    const [sets, setSets] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSet, setSelectedSet] = useState<QuestionSetDetails | null>(null);
    const [viewingSetId, setViewingSetId] = useState<string | null>(null);

    // Edit Set State
    const [isEditingSet, setIsEditingSet] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', level: 'Medium' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Add Questions State
    const [isAddingQuestions, setIsAddingQuestions] = useState(false);
    const [addMode, setAddMode] = useState<'manual' | 'library'>('library');

    // Manual State
    const [newQuestions, setNewQuestions] = useState<Question[]>([]);

    // Library State
    const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
    const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        difficulty: '',
        search: '',
        category: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const res = await fetch('/api/question-sets');
            if (res.ok) {
                const data = await res.json();
                setSets(data);
            }
        } catch (error) {
            console.error('Error fetching sets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSet = async (id: string) => {
        setViewingSetId(id);
        setIsAddingQuestions(false);
        setIsEditingSet(false);
        setNewQuestions([]);
        try {
            const res = await fetch(`/api/question-sets/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedSet(data);
                setEditForm({
                    title: data.title,
                    description: data.description,
                    level: data.level
                });
            }
        } catch (error) {
            console.error('Error fetching set details:', error);
        } finally {
            setViewingSetId(null);
        }
    };

    const handleUpdateSet = async () => {
        if (!selectedSet) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/question-sets/${selectedSet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updatedSet = await res.json();
                // Update local state
                setSelectedSet(prev => prev ? { ...prev, ...updatedSet } : null);
                setSets(prev => prev.map(s => s.id === updatedSet.id ? { ...s, ...updatedSet } : s));
                setIsEditingSet(false);
                toast.success('Question Set updated successfully');
            } else {
                toast.error('Failed to update Question Set');
            }
        } catch (error) {
            console.error('Error updating set:', error);
            toast.error('Error updating Question Set');
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchLibraryQuestions = useCallback(async () => {
        setLibraryLoading(true);
        try {
            const params = new URLSearchParams({
                isLibrary: 'true',
                limit: '50',
            });
            if (filters.type) params.append('type', filters.type);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.category) params.append('category', filters.category);
            // Use 'search' param for generic text search instead of mapping to 'tags'
            if (filters.search) params.append('search', filters.search);

            const res = await fetch(`/api/questions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLibraryQuestions(data.questions || []);
            }
        } catch (error) {
            console.error('Error fetching library:', error);
            toast.error('Failed to load library questions');
        } finally {
            setLibraryLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (isAddingQuestions && addMode === 'library') {
            fetchLibraryQuestions();
        }
    }, [isAddingQuestions, addMode, fetchLibraryQuestions]);

    const toggleLibrarySelection = (id: string) => {
        const newSet = new Set(selectedLibraryIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedLibraryIds(newSet);
    };

    const handleSaveNewQuestions = async () => {
        if (!selectedSet) return;

        // Validation
        if (addMode === 'manual' && newQuestions.length === 0) return;
        if (addMode === 'library' && selectedLibraryIds.size === 0) return;

        setIsSaving(true);
        try {
            const payload: any = {};
            if (addMode === 'manual') {
                payload.questions = newQuestions;
            } else {
                payload.ids = Array.from(selectedLibraryIds);
            }

            const res = await fetch(`/api/question-sets/${selectedSet.id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Successfully added ${data.count} questions`);
                // Reset states
                setNewQuestions([]);
                setSelectedLibraryIds(new Set());
                setIsAddingQuestions(false);
                // Refresh set details
                handleViewSet(selectedSet.id);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to add questions');
            }
        } catch (error) {
            console.error('Error saving questions:', error);
            toast.error('Failed to save questions');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading question sets...</div>;
    }

    if (sets.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Question Sets Yet</h3>
                <p className="text-gray-500 mt-2">Generate a questionnaire to create your first set.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sets.map((set) => (
                    <div
                        key={set.id}
                        onClick={() => handleViewSet(set.id)}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer relative"
                    >
                        {viewingSetId === set.id && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Layers className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${set.level === 'Easy' ? 'bg-green-100 text-green-800' :
                                set.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {set.level}
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{set.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{set.description}</p>

                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                            <div className="flex items-center">
                                <Hash className="h-4 w-4 mr-1" />
                                <span>{set._count.questions} Questions</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{format(new Date(set.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedSet && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedSet(null)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4 border-b pb-3">
                                    <div className="flex-1 mr-4">
                                        {isEditingSet ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="block w-full text-lg font-medium text-gray-900 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Set Title"
                                                />
                                                <textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="block w-full text-sm text-gray-500 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    rows={2}
                                                    placeholder="Description (optional)"
                                                />
                                                <select
                                                    value={editForm.level}
                                                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                                                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="Easy">Easy</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Hard">Hard</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleUpdateSet}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <Save className="h-3 w-3 mr-1" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingSet(false)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedSet.title}</h3>
                                                    {!isAddingQuestions && (
                                                        <button
                                                            onClick={() => setIsEditingSet(true)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title="Edit Set Details"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{selectedSet.description}</p>
                                            </div>
                                        )}
                                    </div>
                                    {!isAddingQuestions && !isEditingSet ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedSet(null)}
                                                className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => setIsAddingQuestions(true)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Questions
                                            </button>
                                        </div>
                                    ) : !isEditingSet && (
                                        <button
                                            onClick={() => setIsAddingQuestions(false)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-1" />
                                            Back to View
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[70vh] overflow-y-auto">
                                    {!isAddingQuestions ? (
                                        <ul className="space-y-4">
                                            {selectedSet.questions.length === 0 ? (
                                                <p className="text-center text-gray-500 py-8">No questions in this set yet.</p>
                                            ) : (
                                                selectedSet.questions.map((q, idx) => (
                                                    <li key={q.id} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-mono text-gray-400 mr-2">#{idx + 1}</span>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{q.text}</p>
                                                                <div className="mt-2 flex gap-2">
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600 uppercase font-medium">{q.type?.replace('_', ' ') || 'Unknown'}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded border ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-100' : q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{q.difficulty}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Mode Tabs */}
                                            <div className="flex border-b border-gray-200 mb-4">
                                                <button
                                                    onClick={() => setAddMode('library')}
                                                    className={`py-2 px-4 text-sm font-medium border-b-2 ${addMode === 'library' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    From Question Bank
                                                </button>
                                                <button
                                                    onClick={() => setAddMode('manual')}
                                                    className={`py-2 px-4 text-sm font-medium border-b-2 ${addMode === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Create New
                                                </button>
                                            </div>

                                            {addMode === 'library' ? (
                                                <div className="space-y-4">
                                                    {/* Filters */}
                                                    <div className="flex gap-3 flex-wrap bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search questions..."
                                                                    className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                                    value={filters.search}
                                                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Job Role Filter */}
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="relative">
                                                                <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Job Role / Category..."
                                                                    className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                                    value={filters.category}
                                                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <select
                                                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                            value={filters.difficulty}
                                                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                                                        >
                                                            <option value="">All Difficulties</option>
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                        <select
                                                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                            value={filters.type}
                                                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                                        >
                                                            <option value="">All Types</option>
                                                            <option value="multiple_choice">Multiple Choice</option>
                                                            <option value="essay">Essay</option>
                                                            <option value="code">Code</option>
                                                        </select>
                                                    </div>

                                                    {/* Library List */}
                                                    <div className="border rounded-md divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                                                        {libraryLoading ? (
                                                            <div className="p-8 text-center text-gray-500">Loading questions...</div>
                                                        ) : libraryQuestions.length === 0 ? (
                                                            <div className="p-8 text-center text-gray-500">No questions found matching criteria.</div>
                                                        ) : (
                                                            libraryQuestions.map((q) => {
                                                                const isSelected = selectedLibraryIds.has(q.id);
                                                                return (
                                                                    <div
                                                                        key={q.id}
                                                                        className={`p-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                                                                        onClick={() => toggleLibrarySelection(q.id)}
                                                                    >
                                                                        <div className="pt-0.5">
                                                                            {isSelected ? (
                                                                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                                                            ) : (
                                                                                <Square className="h-5 w-5 text-gray-300" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-medium text-gray-900">{q.text}</p>
                                                                            <div className="flex gap-2 mt-1">
                                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.type}</span>
                                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.difficulty}</span>
                                                                                {q.category && <span className="text-xs text-gray-400">Role: {q.category}</span>}
                                                                                {q.tags && <span className="text-xs text-gray-400">Tags: {q.tags}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 text-right">
                                                        Selected: {selectedLibraryIds.size} questions
                                                    </div>
                                                </div>
                                            ) : (
                                                <ManualQuestionBuilder
                                                    questions={newQuestions}
                                                    onQuestionsChange={setNewQuestions}
                                                    maxQuestions={20}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAddingQuestions && (
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleSaveNewQuestions}
                                        disabled={isSaving || (addMode === 'manual' ? newQuestions.length === 0 : selectedLibraryIds.size === 0)}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {isSaving ? 'Saving...' : `Save ${addMode === 'manual' ? newQuestions.length : selectedLibraryIds.size} Questions`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingQuestions(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
