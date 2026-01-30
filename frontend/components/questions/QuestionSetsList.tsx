import { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Layers, Hash, Plus, ArrowLeft, Search, CheckSquare, Square, Pencil, X, Save, Briefcase, Trash2 } from 'lucide-react';
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

    const handleDeleteSet = async () => {
        if (!selectedSet) return;
        if (!confirm('Are you sure you want to delete this question set? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/question-sets/${selectedSet.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Question Set deleted successfully');
                setSets(prev => prev.filter(s => s.id !== selectedSet.id));
                setSelectedSet(null);
            } else {
                toast.error('Failed to delete Question Set');
            }
        } catch (error) {
            console.error('Error deleting set:', error);
            toast.error('Error deleting Question Set');
        }
    };

    // Edit Question State
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState<Question[]>([]);

    const handleDeleteQuestion = async (e: React.MouseEvent, questionId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const res = await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Question deleted successfully');
                // Update local state
                if (selectedSet) {
                    const updatedQuestions = selectedSet.questions.filter(q => q.id !== questionId);
                    setSelectedSet({
                        ...selectedSet,
                        questions: updatedQuestions,
                        _count: { questions: updatedQuestions.length }
                    });
                    // Also update the main sets list count
                    setSets(prev => prev.map(s =>
                        s.id === selectedSet.id
                            ? { ...s, _count: { questions: updatedQuestions.length } }
                            : s
                    ));
                }
            } else {
                toast.error('Failed to delete question');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            toast.error('Error deleting question');
        }
    };

    const handleEditQuestion = (e: React.MouseEvent, question: any) => {
        e.stopPropagation();
        // Parse metadata and tags if they are strings
        const processedQuestion = {
            ...question,
            metadata: typeof question.metadata === 'string' ? JSON.parse(question.metadata) : question.metadata,
            tags: typeof question.tags === 'string' ? JSON.parse(question.tags) : question.tags || []
        };
        setQuestionToEdit([processedQuestion]);
        setIsEditingQuestion(true);
    };

    const handleSaveEditedQuestion = async () => {
        if (questionToEdit.length === 0) return;
        const q = questionToEdit[0];

        setIsUpdating(true);
        try {
            const payload = {
                type: q.type,
                text: q.text,
                difficulty: q.difficulty,
                // Pass metadata fields
                ...q.metadata
            };

            const res = await fetch(`/api/questions/${q.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Question updated successfully');
                setIsEditingQuestion(false);
                setQuestionToEdit([]);
                // Reload set
                if (selectedSet) handleViewSet(selectedSet.id);
            } else {
                toast.error('Failed to update question');
            }
        } catch (error) {
            console.error('Error updating question:', error);
            toast.error('Error updating question');
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
        return <div className="p-8 text-center text-muted-foreground">Loading question sets...</div>;
    }

    if (sets.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Question Sets Yet</h3>
                <p className="text-muted-foreground mt-2">Generate a questionnaire to create your first set.</p>
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
                        className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer relative"
                    >
                        {viewingSetId === set.id && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Layers className="h-6 w-6 text-primary" />
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${set.level === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                set.level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {set.level}
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold text-card-foreground mb-2">{set.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{set.description}</p>

                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
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
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedSet(null)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-border">
                            <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                                    <div className="flex-1 mr-4">
                                        {isEditingSet ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="block w-full text-lg font-medium bg-background text-foreground border-input rounded-md focus:ring-primary focus:border-primary"
                                                    placeholder="Set Title"
                                                />
                                                <textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="block w-full text-sm bg-background text-foreground border-input rounded-md focus:ring-primary focus:border-primary"
                                                    rows={2}
                                                    placeholder="Description (optional)"
                                                />
                                                <select
                                                    value={editForm.level}
                                                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                                                    className="block w-full text-sm bg-background text-foreground border-input rounded-md focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="Easy">Easy</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Hard">Hard</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleUpdateSet}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50"
                                                    >
                                                        <Save className="h-3 w-3 mr-1" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingSet(false)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/80"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg leading-6 font-medium text-foreground">{selectedSet.title}</h3>
                                                    {!isAddingQuestions && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => setIsEditingSet(true)}
                                                                className="text-muted-foreground hover:text-foreground p-1"
                                                                title="Edit Set Details"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleDeleteSet}
                                                                className="text-muted-foreground hover:text-destructive p-1"
                                                                title="Delete Question Set"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{selectedSet.description}</p>
                                            </div>
                                        )}
                                    </div>
                                    {!isAddingQuestions && !isEditingSet ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedSet(null)}
                                                className="px-3 py-1.5 border border-input text-xs font-medium rounded-md text-foreground bg-background hover:bg-accent"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => setIsAddingQuestions(true)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Questions
                                            </button>
                                        </div>
                                    ) : !isEditingSet && (
                                        <button
                                            onClick={() => setIsAddingQuestions(false)}
                                            className="inline-flex items-center px-3 py-1.5 border border-input text-xs font-medium rounded-md text-foreground bg-background hover:bg-accent"
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
                                                <p className="text-center text-muted-foreground py-8">No questions in this set yet.</p>
                                            ) : (
                                                selectedSet.questions.map((q, idx) => (
                                                    <li key={q.id} className="bg-muted/30 p-3 rounded-md border border-border">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-mono text-muted-foreground mr-2">#{idx + 1}</span>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{q.text}</p>
                                                                <div className="mt-2 flex gap-2">
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-background border border-border text-muted-foreground uppercase font-medium">{q.type?.replace('_', ' ') || 'Unknown'}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded border ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30' : q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/30' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30'}`}>{q.difficulty}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-1 ml-4">
                                                                <button
                                                                    onClick={(e) => handleEditQuestion(e, q)}
                                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                                    title="Edit Question"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteQuestion(e, q.id)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                                    title="Delete Question"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Mode Tabs */}
                                            <div className="flex border-b border-border mb-4">
                                                <button
                                                    onClick={() => setAddMode('library')}
                                                    className={`py-2 px-4 text-sm font-medium border-b-2 ${addMode === 'library' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    From Question Bank
                                                </button>
                                                <button
                                                    onClick={() => setAddMode('manual')}
                                                    className={`py-2 px-4 text-sm font-medium border-b-2 ${addMode === 'manual' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Create New
                                                </button>
                                            </div>

                                            {addMode === 'library' ? (
                                                <div className="space-y-4">
                                                    {/* Filters */}
                                                    <div className="flex gap-3 flex-wrap bg-muted/50 p-3 rounded-lg border border-border">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search questions..."
                                                                    className="pl-9 w-full rounded-md bg-background border-input shadow-sm focus:border-primary focus:ring-primary text-sm text-foreground"
                                                                    value={filters.search}
                                                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Job Role Filter */}
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="relative">
                                                                <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Job Role / Category..."
                                                                    className="pl-9 w-full rounded-md bg-background border-input shadow-sm focus:border-primary focus:ring-primary text-sm text-foreground"
                                                                    value={filters.category}
                                                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <select
                                                            className="rounded-md bg-background border-input shadow-sm focus:border-primary focus:ring-primary text-sm text-foreground"
                                                            value={filters.difficulty}
                                                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                                                        >
                                                            <option value="">All Difficulties</option>
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                        <select
                                                            className="rounded-md bg-background border-input shadow-sm focus:border-primary focus:ring-primary text-sm text-foreground"
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
                                                    <div className="border border-border rounded-md divide-y divide-border max-h-[400px] overflow-y-auto bg-card">
                                                        {libraryLoading ? (
                                                            <div className="p-8 text-center text-muted-foreground">Loading questions...</div>
                                                        ) : libraryQuestions.length === 0 ? (
                                                            <div className="p-8 text-center text-muted-foreground">No questions found matching criteria.</div>
                                                        ) : (
                                                            libraryQuestions.map((q) => {
                                                                const isSelected = selectedLibraryIds.has(q.id);
                                                                return (
                                                                    <div
                                                                        key={q.id}
                                                                        className={`p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                                                                        onClick={() => toggleLibrarySelection(q.id)}
                                                                    >
                                                                        <div className="pt-0.5">
                                                                            {isSelected ? (
                                                                                <CheckSquare className="h-5 w-5 text-primary" />
                                                                            ) : (
                                                                                <Square className="h-5 w-5 text-muted-foreground" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-medium text-foreground">{q.text}</p>
                                                                            <div className="flex gap-2 mt-1">
                                                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{q.type}</span>
                                                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{q.difficulty}</span>
                                                                                {q.category && <span className="text-xs text-muted-foreground">Role: {q.category}</span>}
                                                                                {q.tags && <span className="text-xs text-muted-foreground">Tags: {q.tags}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground text-right">
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
                                <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
                                    <button
                                        type="button"
                                        onClick={handleSaveNewQuestions}
                                        disabled={isSaving || (addMode === 'manual' ? newQuestions.length === 0 : selectedLibraryIds.size === 0)}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {isSaving ? 'Saving...' : `Save ${addMode === 'manual' ? newQuestions.length : selectedLibraryIds.size} Questions`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingQuestions(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-accent sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isEditingQuestion && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsEditingQuestion(false)}></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-border">
                            <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Edit Question</h3>
                                <div className="mt-2">
                                    <ManualQuestionBuilder
                                        questions={questionToEdit}
                                        onQuestionsChange={setQuestionToEdit}
                                        maxQuestions={1}
                                    />
                                </div>
                            </div>
                            <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
                                <button
                                    type="button"
                                    onClick={handleSaveEditedQuestion}
                                    disabled={isUpdating}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingQuestion(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-accent sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
