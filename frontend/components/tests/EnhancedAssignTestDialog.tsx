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
  type: 'multiple_choice' | 'essay' | 'code';
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
      setUploadedResume(file);

      toast({
        title: 'Resume uploaded successfully',
        description: 'Resume has been analyzed and is ready for question generation.'
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
      const response = await fetch('/api/ai/generate-test-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          candidateId: selectedCandidateId,
          resumeUrl: uploadedResume ? 'uploaded-resume' : selectedCandidate?.resumeUrl,
          jobDescription: test.jobDescription,
          mcqCount: test.mcqQuestions || 2,
          conversationalCount: test.conversationalQuestions || 2,
          codingCount: test.codingQuestions || 1,
          personalized: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate question preview');
      }

      const data = await response.json();
      setPreviewData(data);

      toast({
        title: 'Questions generated',
        description: `Generated ${data.questions.length} personalized questions for preview.`
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
          await Promise.all(previewData.questions.map(q =>
            fetch('/api/questions', {
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
            })
          ));
          toast({ title: 'Questions saved to bank', description: 'Generated questions have been added to your library.' });
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
                Question Preview
              </h3>
              <p className="text-sm text-gray-500">
                Review and edit the personalized questions before assigning the test
              </p>
            </div>

            {!previewData && (
              <div className="text-center py-8">
                <button
                  onClick={generateQuestionPreview}
                  disabled={isGeneratingPreview}
                  className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPreview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 inline-block mr-2" />
                      Generate Personalized Questions
                    </>
                  )}
                </button>
              </div>
            )}

            {previewData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {previewData.questions.length} Personalized Questions Generated
                      </p>
                      <p className="text-xs text-green-700">{previewData.message}</p>
                    </div>
                  </div>
                </div>

                {/* Editable Builder */}
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-2">
                  <ManualQuestionBuilder
                    questions={previewData.questions} // Pass state
                    onQuestionsChange={(qs) => setPreviewData({ ...previewData, questions: qs })} // Update state
                    maxQuestions={20}
                  />
                </div>

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
                    Save these questions to the Question Bank library for future use
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
