'use client';

import { useState, useEffect } from 'react';
import { Test, Candidate } from '@/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';

interface BulkAssignTestDialogProps {
  selectedCandidates: Candidate[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkAssignTestDialog({ 
  selectedCandidates, 
  onClose, 
  onSuccess 
}: BulkAssignTestDialogProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [companyName, setCompanyName] = useState('Our Company');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeOption, setResumeOption] = useState<'individual' | 'shared' | 'jobdesc'>('jobdesc');
  const [individualResumes, setIndividualResumes] = useState<{[candidateId: string]: File}>({});
  const [assignmentResults, setAssignmentResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests');
        if (response.ok) {
          const data = await response.json();
          setTests(data.tests);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const handleIndividualResumeUpload = (candidateId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setIndividualResumes(prev => ({
        ...prev,
        [candidateId]: file
      }));
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    // Validation
    if (resumeOption === 'shared' && !resumeFile) {
      alert('Please upload a shared resume file');
      return;
    }

    if (resumeOption === 'individual') {
      const missingResumes = selectedCandidates.filter(candidate => !individualResumes[candidate.id]);
      if (missingResumes.length > 0) {
        alert(`Please upload resumes for: ${missingResumes.map(c => c.name).join(', ')}`);
        return;
      }
    }

    setIsSubmitting(true);
    const results: any[] = [];

    try {
      // Upload shared resume if provided
      if (resumeFile && resumeOption === 'shared') {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('candidateId', 'shared'); // Special identifier for shared resume
        formData.append('testId', selectedTest);

        const uploadResponse = await fetch(`/api/tests/${selectedTest}/upload-resume`, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          console.warn('Shared resume upload failed, proceeding without it');
        }
      }

      // Process each candidate
      for (const candidate of selectedCandidates) {
        try {
          // Upload individual resume if provided
          if (resumeOption === 'individual' && individualResumes[candidate.id]) {
            const formData = new FormData();
            formData.append('resume', individualResumes[candidate.id]);
            formData.append('candidateId', candidate.id);
            formData.append('testId', selectedTest);

            const uploadResponse = await fetch(`/api/tests/${selectedTest}/upload-resume`, {
              method: 'POST',
              body: formData
            });

            if (!uploadResponse.ok) {
              console.warn(`Resume upload failed for ${candidate.name}, proceeding without it`);
            }
          }

          const response = await fetch(`/api/tests/${selectedTest}/assign-with-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              candidateId: candidate.id,
              sendEmail,
              companyName
            }),
          });

          if (response.ok) {
            const result = await response.json();
            results.push({
              candidate: candidate.name,
              email: candidate.email,
              status: 'success',
              emailSent: result.emailSent,
              uniqueLink: result.assignment.uniqueLink
            });
          } else {
            const errorData = await response.json();
            results.push({
              candidate: candidate.name,
              email: candidate.email,
              status: 'error',
              error: errorData.error || 'Assignment failed'
            });
          }
        } catch (error) {
          results.push({
            candidate: candidate.name,
            email: candidate.email,
            status: 'error',
            error: 'Network error'
          });
        }
      }

      setAssignmentResults(results);
      setShowResults(true);

    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Failed to process bulk assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (showResults) {
      onSuccess(); // Refresh the candidates list
    }
    onClose();
  };

  if (showResults) {
    const successCount = assignmentResults.filter(r => r.status === 'success').length;
    const errorCount = assignmentResults.filter(r => r.status === 'error').length;
    const emailsSent = assignmentResults.filter(r => r.emailSent).length;

    return (
      <Drawer open={true} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-w-4xl">
          <DrawerHeader>
            <DrawerTitle>Bulk Assignment Results</DrawerTitle>
            <DrawerClose onClick={handleClose} />
          </DrawerHeader>
          
          <div className="flex-1 p-6 overflow-auto">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-red-700">Failed</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{emailsSent}</div>
                <div className="text-blue-700">Emails Sent</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Detailed Results:</h3>
              {assignmentResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{result.candidate}</div>
                      <div className="text-sm text-gray-600">{result.email}</div>
                    </div>
                    <div className="text-right">
                      {result.status === 'success' ? (
                        <div>
                          <span className="text-green-600 font-medium">✓ Assigned</span>
                          {result.emailSent && (
                            <div className="text-sm text-green-600">Email sent</div>
                          )}
                          {result.uniqueLink && (
                            <div className="text-xs text-gray-500 mt-1">
                              Link: {result.uniqueLink.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-red-600 font-medium">✗ Failed</span>
                          <div className="text-sm text-red-600">{result.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Done
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>Assign Test to {selectedCandidates.length} Candidates</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>
        
        <form onSubmit={handleBulkAssign} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Selected Candidates Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected Candidates:</h3>
              <div className="max-h-32 overflow-y-auto">
                {selectedCandidates.map((candidate, index) => (
                  <div key={candidate.id} className="text-sm text-gray-600 py-1">
                    {index + 1}. {candidate.name} ({candidate.email})
                  </div>
                ))}
              </div>
            </div>
            {/* Test Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test
              </label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading tests...</div>
              ) : tests.length === 0 ? (
                <div className="text-sm text-gray-500">No tests available. Create a test first.</div>
              ) : (
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select a test...</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title} ({test.duration} min)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Resume Options Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Resume for AI Question Generation</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    checked={resumeOption === 'jobdesc'}
                    onChange={() => setResumeOption('jobdesc')}
                    className="mr-2"
                  />
                  Use job description only (no resume)
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    checked={resumeOption === 'individual'}
                    onChange={() => setResumeOption('individual')}
                    className="mr-2"
                  />
                  Upload individual resume for each candidate
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    checked={resumeOption === 'shared'}
                    onChange={() => setResumeOption('shared')}
                    className="mr-2"
                  />
                  Upload shared resume for all candidates
                </label>
                
                {resumeOption === 'shared' && (
                  <div className="ml-6">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a job description or sample resume (PDF, DOC, DOCX, or TXT, max 5MB)
                    </p>
                    {resumeFile && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {resumeFile.name} selected
                      </p>
                    )}
                  </div>
                )}
                
                {resumeOption === 'individual' && (
                  <div className="ml-6 space-y-4">
                    <p className="text-sm text-gray-600">Upload a resume for each candidate:</p>
                    {selectedCandidates.map((candidate) => (
                      <div key={candidate.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{candidate.name}</span>
                          <span className="text-xs text-gray-500">{candidate.email}</span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleIndividualResumeUpload(candidate.id, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {individualResumes[candidate.id] && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {individualResumes[candidate.id].name} selected
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email Settings */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Email Invitation</h3>
              
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mr-2"
                />
                Send invitation emails to all candidates
              </label>
              
              {sendEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name (for emails)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Your Company Name"
                  />
                </div>
              )}
            </div>

          </div>

          <DrawerFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !selectedTest}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? `Assigning to ${selectedCandidates.length} candidates...` : `Assign to ${selectedCandidates.length} Candidates`}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
