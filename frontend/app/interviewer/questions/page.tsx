'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, Filter, BookOpen } from 'lucide-react';
import ManualQuestionBuilder, { Question } from '@/components/tests/ManualQuestionBuilder';
import GenerateQuestionnaireModal from '@/components/tests/GenerateQuestionnaireModal';

interface LibraryQuestion {
    id: string;
    type: 'multiple_choice' | 'essay' | 'code';
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category?: string;
    tags?: string; // JSON string array
    metadata: any;
    isTechnical?: boolean;
    createdAt: string;
}

import QuestionSetsList from '@/components/questions/QuestionSetsList';

export default function QuestionsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'questions' | 'sets'>('questions');
    const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterSkills, setFilterSkills] = useState('');
    const [filterTechnical, setFilterTechnical] = useState<'all' | 'technical' | 'non-technical'>('all');
    const [filterLanguage, setFilterLanguage] = useState('');
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [showBuilder, setShowBuilder] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<LibraryQuestion | null>(null);

    useEffect(() => {
        if (activeTab === 'questions') {
            fetchQuestions();
        }
    }, [filterDifficulty, filterRole, filterSkills, filterTechnical, filterLanguage, filterType, page, activeTab]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('isLibrary', 'true');
            params.append('page', page.toString());
            params.append('limit', '10');

            if (filterType) params.append('type', filterType);
            if (filterDifficulty) params.append('difficulty', filterDifficulty);
            if (filterRole) params.append('category', filterRole);
            if (filterSkills) params.append('tags', filterSkills);
            if (filterTechnical !== 'all') {
                params.append('isTechnical', filterTechnical === 'technical' ? 'true' : 'false');
            }
            if (filterLanguage && filterTechnical === 'technical') {
                params.append('language', filterLanguage);
            }

            const res = await fetch(`/api/questions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions);
                setTotalPages(data.pagination?.pages || 1);
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
            const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchQuestions();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const openAddModal = () => {
        setBuilderQuestions([]);
        setIsModalOpen(true);
    };

    const handleSaveToLibrary = async () => {
        if (builderQuestions.length === 0) return;
        setIsSaving(true);
        try {
            const q = builderQuestions[0];
            const payload = {
                text: q.text,
                type: q.type,
                difficulty: q.difficulty,
                metadata: q.metadata,
                isLibrary: true,
                isTechnical: q.isTechnical ?? true,
                category: 'General'
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

    return (
        <div className="p-6 bg-background min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
                    <p className="text-sm text-muted-foreground">Manage your reusable library of questions.</p>
                </div>
                {activeTab === 'questions' && (
                    <div className="flex items-center">
                        <button
                            onClick={() => setShowGenerator(true)}
                            className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
                        >
                            <BookOpen className="-ml-1 mr-2 h-5 w-5 text-muted-foreground" />
                            Generate Set
                        </button>
                        <button
                            onClick={() => {
                                setEditingQuestion(null);
                                setShowBuilder(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-opacity"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </button>
                    </div>
                )}
                {activeTab === 'sets' && (
                    <div className="flex items-center">
                        <button
                            onClick={() => {
                                setActiveTab('questions');
                                setShowGenerator(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-opacity"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Question Set
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        All Questions
                    </button>
                    <button
                        onClick={() => setActiveTab('sets')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sets'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        Question Sets
                    </button>
                </nav>
            </div>

            {activeTab === 'sets' ? (
                <QuestionSetsList />
            ) : (
                <>
                    {/* Filter Bar */}
                    <div className="bg-card p-4 rounded-lg shadow mb-6 space-y-4 border border-border">
                        <div className="flex gap-4">

                            {/* Role Filter */}
                            <div className="w-1/4">
                                <input
                                    type="text"
                                    placeholder="Job Role / Category"
                                    className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                />
                            </div>
                            {/* Skills Filter */}
                            <div className="w-1/4">
                                <input
                                    type="text"
                                    placeholder="Skills / Tags"
                                    className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    value={filterSkills}
                                    onChange={(e) => setFilterSkills(e.target.value)}
                                />
                            </div>
                            {/* Experience/Difficulty Filter */}
                            <div className="w-1/6">
                                <select
                                    className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    value={filterDifficulty}
                                    onChange={(e) => setFilterDifficulty(e.target.value)}
                                >
                                    <option value="">Level (All)</option>
                                    <option value="Easy">Intern / Junior</option>
                                    <option value="Medium">Mid-Level</option>
                                    <option value="Hard">Senior / Lead</option>
                                </select>
                            </div>
                            {/* Question Type Filter */}
                            <div className="w-1/6">
                                <select
                                    className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="">Type (All)</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="essay">Essay</option>
                                    <option value="code">Code</option>
                                    <option value="short_answer">Short Answer</option>
                                </select>
                            </div>
                            <div className="w-1/6">
                                <select
                                    className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    value={filterTechnical}
                                    onChange={(e) => setFilterTechnical(e.target.value as any)}
                                >
                                    <option value="all">Technical: All</option>
                                    <option value="technical">Technical Only</option>
                                    <option value="non-technical">Non-Technical Only</option>
                                </select>
                            </div>
                            {/* Language Filter - Conditional */}
                            {filterTechnical === 'technical' && (
                                <div className="w-1/6">
                                    <select
                                        className="block w-full px-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                        value={filterLanguage}
                                        onChange={(e) => setFilterLanguage(e.target.value)}
                                    >
                                        <option value="">Language (All)</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="c++">C++</option>
                                        <option value="c#">C#</option>
                                        <option value="sql">SQL</option>
                                        <option value="html">HTML/CSS</option>
                                        <option value="swift">Swift</option>
                                        <option value="kotlin">Kotlin</option>
                                        <option value="go">Go</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card shadow overflow-hidden sm:rounded-md mb-4 border border-border">
                        <ul className="divide-y divide-border">
                            {loading ? (
                                <li className="px-6 py-4 text-center text-muted-foreground">Loading library...</li>
                            ) : questions.length === 0 ? (
                                <li className="px-6 py-4 text-center text-muted-foreground">No questions found.</li>
                            ) : (
                                questions.map((q) => (
                                    <li key={q.id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${q.type === 'multiple_choice' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                                                q.type === 'code' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}>
                                                            {q.type.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${q.difficulty === 'Easy' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                                                q.difficulty === 'Hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                                                            {q.difficulty}
                                                        </span>
                                                        {q.category && (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                                                {q.category}
                                                            </span>
                                                        )}
                                                        {q.tags && (() => {
                                                            try {
                                                                const tags = typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags;
                                                                if (Array.isArray(tags)) {
                                                                    return tags.map((tag: string, i: number) => (
                                                                        <span key={i} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                                            {tag}
                                                                        </span>
                                                                    ));
                                                                }
                                                                return null;
                                                            } catch (e) { return null; }
                                                        })()}

                                                        {q.isTechnical === false && (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
                                                                Non-Technical
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground break-words whitespace-pre-wrap">{q.text}</p>

                                                    {/* Render MCQ Options */}
                                                    {q.type === 'multiple_choice' && (() => {
                                                        try {
                                                            const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                                                            return (
                                                                <div className="mt-2 pl-4 border-l-2 border-border">
                                                                    <ul className="list-disc list-inside space-y-1">
                                                                        {meta.options?.map((opt: string, i: number) => (
                                                                            <li key={i} className={`text-sm ${meta.correctAnswer === i ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                                                                                {opt} {meta.correctAnswer === i && '✓'}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            );
                                                        } catch (e) { return null; }
                                                    })()}

                                                    {/* Render Essay details */}
                                                    {q.type === 'essay' && (() => {
                                                        try {
                                                            const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                                                            return (
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Min Words: {meta.minWords || 50} | Max Words: {meta.maxWords || 200}
                                                                </p>
                                                            );
                                                        } catch (e) { return null; }
                                                    })()}

                                                    {q.type === 'code' && (
                                                        <p className="mt-1 text-xs text-muted-foreground font-mono">
                                                            Language: {(() => {
                                                                try {
                                                                    return (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata).language;
                                                                } catch { return 'Unknown'; }
                                                            })()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center">
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
                                className="px-3 py-1 border border-border rounded disabled:opacity-50 bg-card text-foreground"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-foreground">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 border border-border rounded disabled:opacity-50 bg-card text-foreground"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-border">
                            <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-foreground mb-4" id="modal-title">
                                            Add Question to Library
                                        </h3>
                                        <div className="mt-2">
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
                            <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSaveToLibrary}
                                    disabled={builderQuestions.length === 0 || isSaving}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save to Library'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Generator Modal */}
            <GenerateQuestionnaireModal
                isOpen={showGenerator}
                onClose={() => setShowGenerator(false)}
            />
        </div>
    );
}
