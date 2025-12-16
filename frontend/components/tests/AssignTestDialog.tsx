'use client';

import { useState, useEffect } from 'react';
import { Test, Candidate } from '@/types';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '../ui/use-toast';

type Props = {
  test: Test;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignTestDialog({ test, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/candidates');
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

  const analyzeExistingResume = async (candidateId: string, resumeUrl: string) => {
    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          testId: test.id,
          resumeUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      return true;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      return false;
    }
  };

  const generateAITest = async () => {
    setIsGeneratingTest(true);
    try {
      const response = await fetch(`/api/ai/generate-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          candidateId: selectedCandidateId,
          jobDescription: test.jobDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate test questions');
      }

      toast({
        title: 'Test questions generated',
        description: 'AI has created personalized questions based on the job requirements and candidate profile.'
      });

      return true;
    } catch (error) {
      console.error('Error generating test:', error);
      toast({
        title: 'Error generating test questions',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if candidate has resume and analyze it
      if (selectedCandidate?.resumeUrl) {
        const resumeAnalyzed = await analyzeExistingResume(selectedCandidateId, selectedCandidate.resumeUrl);
        if (resumeAnalyzed) {
          const success = await generateAITest();
          if (!success) {
            throw new Error('Failed to generate AI test questions');
          }
        }
      }

      // Then assign the test
      const response = await fetch(`/api/tests/${test.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidateId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign test');
      }

      toast({
        title: 'Test assigned successfully',
        description: selectedCandidate?.resumeUrl ?
          'AI-generated questions have been added to the test based on the candidate\'s resume.' :
          'Standard test questions have been assigned.'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Test</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select a candidate to assign the test &quot;{test.title}&quot;
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                                <span className="text-xs">Resume</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-500">
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

          {selectedCandidate && (
            <div className="mt-4 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Resume Status</h3>
              {selectedCandidate.resumeUrl ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Resume Available</p>
                    <p className="text-xs text-gray-500">AI will generate personalized questions based on the candidate&apos;s resume.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-red-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">No Resume Found</p>
                    <p className="text-xs text-gray-500">The candidate needs to upload their resume in their profile before assignment.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedCandidateId || (selectedCandidate ? !selectedCandidate.resumeUrl : false)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Assigning...' : isGeneratingTest ? 'Generating Questions...' : 'Assign Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
