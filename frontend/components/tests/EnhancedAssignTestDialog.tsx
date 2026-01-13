'use client';

import { useState, useEffect } from 'react';
import { Test, Candidate } from '@/types';
import { AlertCircle, CheckCircle, Upload, Eye, FileText, Sparkles } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import ManualQuestionBuilder from './ManualQuestionBuilder';

type Props = {
  test: Test;
  onClose: () => void;
  onSuccess: () => void;
};

interface Question {
  id: string;
  type: 'multiple_choice' | 'essay' | 'code' | 'short_answer';
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  metadata?: any;
}

interface PreviewData {
  questions: Question[];
  resumeAnalysis?: any;
  personalized: boolean;
  message: string;
}

export default function EnhancedAssignTestDialog({ test, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'upload' | 'preview' | 'confirm'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Resume upload state
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [saveToBank, setSaveToBank] = useState(false);

  // Suggestions state
  const [suggestedQuestions, setSuggestedQuestions] = useState<Question[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch suggested questions when entering preview step
  useEffect(() => {
    console.log('Suggestions Effect Triggered:', { step, extractedSkills: extractedSkills.length, currentSuggestions: suggestedQuestions.length });
    if (step === 'preview' && suggestedQuestions.length === 0) {
      const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
          // Fetch library questions
          console.log('Fetching library questions for skills:', extractedSkills);
          const res = await fetch('/api/questions?isLibrary=true&limit=50');
          if (res.ok) {
            const data = await res.json();
            console.log('Suggestions Debug:', data.debug);
            const libraryQs: any[] = data.questions || [];

            let matches: Question[] = [];

            if (extractedSkills.length === 0) {
              // Fallback: Show latest 20 questions if no skills extracted
              matches = libraryQs.slice(0, 20).map(q => ({
                id: q.id,
                type: q.type,
                text: q.text,
                difficulty: q.difficulty,
                order: 0,
                metadata: q.metadata
              } as Question));
            } else {
              // Score questions based on matching tags and content
              const scoredQs = libraryQs.map(q => {
                let score = 0;
                let qTags: string[] = [];
                try {
                  // Parse tags if string, or use if array
                  qTags = typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []);
                } catch (e) {
                  qTags = [];
                }

                const tagsArray = Array.isArray(qTags) ? qTags : [];

                // 1. Tag Matches (Higher weight)
                const matchCount = tagsArray.filter(tag =>
                  extractedSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(skill.toLowerCase()))
                ).length;

                // 2. Text Content Matches (Fallback)
                const textMatches = extractedSkills.filter(skill =>
                  q.text && q.text.toLowerCase().includes(skill.toLowerCase())
                ).length;

                score = (matchCount * 3) + textMatches;
                return { ...q, score };
              });

              // Filter and sort
              matches = scoredQs
                .filter(q => q.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 20) // Increased from 5 to 20 matches
                .map(q => ({
                  id: q.id,
                  type: q.type,
                  text: q.text,
                  difficulty: q.difficulty,
                  order: 0,
                  metadata: q.metadata
                } as Question));
            }

            setSuggestedQuestions(matches);
          }
        } catch (e) {
          console.error("Failed to fetch suggestions", e);
        } finally {
          setIsLoadingSuggestions(false);
        }
      };

      fetchSuggestions();
    }
  }, [step, extractedSkills, suggestedQuestions.length]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        let url = '/api/candidates';
        if (test.organizationId) {
          url += `?organizationId=${test.organizationId}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setCandidates(data.candidates);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(candidate =>
    searchTerm === '' ||
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    const candidate = candidates.find(c => c.id === candidateId);
    setSelectedCandidate(candidate || null);

    // Populate skills from existing candidate data
    if (candidate) {
      const skillsStr = (candidate as any).skills;
      if (skillsStr && typeof skillsStr === 'string') {
        const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
        console.log('Loaded skills from candidate:', skills);
        setExtractedSkills(skills);
      } else {
        setExtractedSkills([]);
      }
    }
  };

  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('candidateId', selectedCandidateId);
      formData.append('testId', test.id);

      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload and analyze resume');
      }

      const data = await response.json();
      console.log('Resume Analysis Result:', data);

      setUploadedResume(file);

      // Save extracted skills for suggestion logic
      if (data.analysis && Array.isArray(data.analysis.skills)) {
        console.log('Extracted Skills:', data.analysis.skills);
        setExtractedSkills(data.analysis.skills);
      } else {
        console.warn('No skills found in analysis');
      }

      toast({
        title: 'Resume uploaded successfully',
        description: 'Resume has been analyzed. Proceed to select questions.'
      });

      return true;
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Error uploading resume',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsUploadingResume(false);
    }
  };

  const generateQuestionPreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Calculate remaining questions needed based on test config vs already selected questions
      const currentQuestions = previewData?.questions || [];
      const existingMcq = currentQuestions.filter(q => q.type === 'multiple_choice').length;
      const existingCoding = currentQuestions.filter(q => q.type === 'code').length;
      const existingConversational = currentQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer').length;

      const mcqCount = Math.max(0, (test.mcqQuestions || 0) - existingMcq);
      const codingCount = Math.max(0, (test.codingQuestions || 0) - existingCoding);
      const conversationalCount = Math.max(0, (test.conversationalQuestions || 0) - existingConversational);

      if (mcqCount === 0 && codingCount === 0 && conversationalCount === 0) {
        toast({
          title: 'Question quota met',
          description: 'You have already selected enough questions for this test configuration.'
        });
        setIsGeneratingPreview(false);
        return;
      }

      const response = await fetch('/api/ai/generate-test-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          candidateId: selectedCandidateId,
          resumeUrl: uploadedResume ? 'uploaded-resume' : selectedCandidate?.resumeUrl,
          jobDescription: test.jobDescription,
          mcqCount,
          conversationalCount,
          codingCount,
          personalized: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate question preview');
      }

      const data = await response.json();

      // Merge with existing manual selections if any
      const existingQs = previewData?.questions || [];
      const newQs = data.questions.map((q: any) => ({ ...q, order: existingQs.length + q.order })); // partial order fix

      setPreviewData({
        ...data,
        questions: [...existingQs, ...newQs]
      });

      toast({
        title: 'Questions generated',
        description: `Generated ${data.questions.length} personalized questions.`
      });

      return true;
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error generating preview',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleFinalAssignment = async () => {
    setIsLoading(true);
    try {
      // 1. Save to Bank if requested
      if (saveToBank && previewData?.questions) {
        try {
          // Only save questions that are likely new (not from library)
          // Filter by IS_LIBRARY flag and known ID patterns for temporary questions
          const questionsToSave = previewData.questions.filter(q => {
            // If it's explicitly marked as library, skip
            if ((q as any).isLibrary) return false;

            // Broader check for temporary IDs:
            // 1. Matches known prefixes
            // 2. Contains underscore (CUIDs typically don't)
            // 3. Shorter than 20 chars (CUIDs are 25)
            const isTempId = q.id.startsWith('manual_') ||
              q.id.startsWith('mcq_') ||
              q.id.startsWith('conv_') ||
              q.id.startsWith('code_') ||
              q.id.includes('_') ||
              q.id.length < 20;

            console.log(`Checking question ${q.id}: isTemp=${isTempId}`);
            return isTempId;
          });

          // Deduplicate by text content to be safe
          const uniqueQuestionsToSave = questionsToSave.filter((q, index, self) =>
            index === self.findIndex((t) => t.text === q.text)
          );

          if (uniqueQuestionsToSave.length > 0) {
            console.log('Saving new questions to bank:', uniqueQuestionsToSave.length);
            const savePromises = uniqueQuestionsToSave.map(async (q) => {
              try {
                const res = await fetch('/api/questions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: q.text,
                    type: q.type,
                    difficulty: q.difficulty || 'Medium',
                    metadata: q.metadata,
                    isLibrary: true,
                    category: test.title || 'Personalized',
                    tags: (q as any).tags || previewData.resumeAnalysis?.skills || []
                  })
                });

                if (!res.ok) {
                  const errText = await res.text();
                  console.error(`Failed to save question ${q.id}:`, errText);
                  return { success: false, id: q.id, error: errText };
                }
                return { success: true, id: q.id };
              } catch (err) {
                console.error(`Network error saving question ${q.id}:`, err);
                return { success: false, id: q.id, error: err };
              }
            });

            const results = await Promise.all(savePromises);
            const successCount = results.filter(r => r.success).length;
            console.log(`Save Results: ${successCount}/${uniqueQuestionsToSave.length} successes`);

            if (successCount > 0) {
              toast({ title: 'Questions saved to bank', description: `${successCount} new questions have been added to your library.` });
            } else {
              toast({ title: 'Save Failed', description: 'Could not save questions to bank. Check console.', variant: 'destructive' });
            }
          }
        } catch (e) {
          console.error('Failed to save to bank', e);
        }
      }

      const response = await fetch(`/api/tests/${test.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          personalizedQuestions: previewData?.questions || [],
          resumeUploaded: !!uploadedResume
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign test');
      }

      toast({
        title: 'Test assigned successfully',
        description: `Personalized test with ${previewData?.questions.length || 0} questions has been assigned to ${selectedCandidate?.name}.`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning test:', error);
      toast({
        title: 'Error assigning test',
        description: error instanceof Error ? error.message : 'Failed to assign test. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Search Candidates</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or email"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Candidate</label>
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredCandidates.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No candidates found' : 'Loading candidates...'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredCandidates.map(candidate => (
                      <label
                        key={candidate.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center ${selectedCandidateId === candidate.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          value={candidate.id}
                          className="sr-only"
                          checked={selectedCandidateId === candidate.id}
                          onChange={(e) => handleCandidateSelection(e.target.value)}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                              <p className="text-sm text-gray-500">{candidate.email}</p>
                            </div>
                            <div className="flex items-center">
                              {candidate.resumeUrl ? (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  <span className="text-xs">Has Resume</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-amber-500">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  <span className="text-xs">No Resume</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={!selectedCandidateId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next: Resume Upload
              </button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Resume for {selectedCandidate?.name}
              </h3>
              <p className="text-sm text-gray-500">
                Upload the candidate&apos;s resume to generate personalized questions
              </p>
            </div>

            {selectedCandidate?.resumeUrl && !uploadedResume && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Existing Resume Found</p>
                    <p className="text-xs text-blue-700">
                      You can use the existing resume or upload a new one for this assignment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {uploadedResume ? uploadedResume.name : 'Upload Resume'}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PDF, DOC, or DOCX up to 10MB
                    </span>
                  </label>
                  <input
                    id="resume-upload"
                    name="resume-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResumeUpload(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {isUploadingResume && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Analyzing resume...</p>
              </div>
            )}

            <div className="flex justify-between space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('preview')}
                disabled={!uploadedResume && !selectedCandidate?.resumeUrl}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next: Preview Questions
              </button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Question Selection
              </h3>
              <p className="text-sm text-gray-500">
                Select questions from the bank or generate new ones using AI
              </p>
            </div>

            {/* Suggestions Section */}
            {step === 'preview' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {extractedSkills.length > 0
                      ? `Suggested from Bank (${extractedSkills.length} skills detected)`
                      : 'Recent Questions from Bank'
                    }
                  </div>
                  {isLoadingSuggestions && <div className="animate-spin h-3 w-3 border-b-2 border-blue-700 rounded-full"></div>}
                </h4>

                {suggestedQuestions.length === 0 && !isLoadingSuggestions ? (
                  <p className="text-sm text-gray-500 italic">No matching questions found in the bank.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {suggestedQuestions.map(q => {
                      const isAdded = previewData?.questions.some(pq => pq.id === q.id);
                      return (
                        <div key={q.id} className="bg-white p-3 rounded border border-blue-200 flex justify-between items-start">
                          <div className="flex-1 mr-2">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.text}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.type}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.difficulty}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newQ: Question = { ...q, order: (previewData?.questions.length || 0) + 1 };
                              const currentQuestions = previewData?.questions || [];
                              setPreviewData({
                                questions: isAdded
                                  ? currentQuestions.filter(pq => pq.id !== q.id)
                                  : [...currentQuestions, newQ],
                                personalized: previewData?.personalized || false,
                                message: previewData?.message || 'Custom selection'
                              });
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded border ${isAdded
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                              }`}
                          >
                            {isAdded ? 'Added ✓' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center py-4 border-b border-gray-100">
              <button
                onClick={generateQuestionPreview}
                disabled={isGeneratingPreview}
                className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 disabled:opacity-50 text-sm font-medium flex items-center justify-center"
              >
                {isGeneratingPreview ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {previewData ? 'Regenerate with AI' : 'Generate with AI'}
              </button>

              <button
                onClick={() => {
                  // Add an empty manual question
                  const newQ: Question = {
                    id: `manual_${Date.now()}`,
                    type: 'multiple_choice',
                    text: '',
                    difficulty: 'Medium',
                    order: (previewData?.questions.length || 0) + 1,
                    metadata: { options: ['', ''], correctAnswer: 0 }
                  };
                  setPreviewData({
                    questions: [...(previewData?.questions || []), newQ],
                    personalized: previewData?.personalized || false,
                    message: previewData?.message || 'Manual creation'
                  });
                }}
                className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Custom Question
              </button>
            </div>

            {/* Questions Builder / List */}
            {previewData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm text-gray-600">
                  <span>Selected Questions: {previewData.questions.length}</span>
                  {previewData.questions.length === 0 && <span className="text-amber-600">Select or generate questions to proceed</span>}
                </div>

                {previewData.questions.length > 0 && (
                  <div className="max-h-[50vh] overflow-y-auto border rounded-lg p-2">
                    <ManualQuestionBuilder
                      questions={previewData.questions}
                      onQuestionsChange={(qs) => setPreviewData({ ...previewData, questions: qs })}
                      maxQuestions={20}
                    />
                  </div>
                )}

                {/* Save to Bank Checkbox */}
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="saveToBank"
                    checked={saveToBank}
                    onChange={(e) => setSaveToBank(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="saveToBank" className="ml-2 block text-sm text-gray-900">
                    Save newly created questions to the Question Bank
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              {previewData && (
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  Next: Confirm
                </button>
              )}
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Test Assignment
              </h3>
              <p className="text-sm text-gray-500">
                Review the assignment details before finalizing
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Test:</span>
                <span className="text-sm text-gray-900">{test.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Candidate:</span>
                <span className="text-sm text-gray-900">{selectedCandidate?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <span className="text-sm text-gray-900">{test.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Questions:</span>
                <span className="text-sm text-gray-900">{previewData?.questions.length || 0} personalized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Resume:</span>
                <span className="text-sm text-gray-900">
                  {uploadedResume ? 'Newly uploaded' : 'Existing resume used'}
                </span>
              </div>
            </div>

            <div className="flex justify-between space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Preview
              </button>
              <button
                type="button"
                onClick={handleFinalAssignment}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : 'Assign Test'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with steps */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Assign Test with Personalized Questions</h2>
            <div className="flex items-center space-x-4">
              {['select', 'upload', 'preview', 'confirm'].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === stepName ? 'bg-primary text-white' :
                    ['select', 'upload', 'preview', 'confirm'].indexOf(step) > index ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {index + 1}
                  </div>
                  {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                </div>
              ))}
            </div>
          </div>

          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
