'use client';

import { useState, useEffect } from 'react';
import { Test } from '@/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';

interface EnhancedAssignTestDialogProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnhancedAssignTestDialog({
  candidateId,
  candidateName,
  candidateEmail,
  onClose,
  onSuccess
}: EnhancedAssignTestDialogProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [companyName, setCompanyName] = useState('Our Company');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [testPreview, setTestPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);

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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const generateTestPreview = async () => {
    if (!selectedTest) return;

    setIsSubmitting(true);
    try {
      // First, upload resume if provided
      let resumeUrl = null;
      if (resumeFile && !useExistingResume) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('candidateId', candidateId);
        formData.append('testId', selectedTest);

        // Include pre-extracted text from OCR if available
        if (extractedText) {
          formData.append('extractedText', extractedText);
        }

        const uploadResponse = await fetch('/api/ai/analyze-resume', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          resumeUrl = uploadData.resumeUrl;
        }
      }

      // Generate test preview with AI questions
      const previewResponse = await fetch('/api/ai/generate-test-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: selectedTest,
          candidateId,
          mcqCount: 3,
          conversationalCount: 2,
          codingCount: 1,
          resumeUrl
        })
      });

      if (previewResponse.ok) {
        const previewData = await previewResponse.json();
        const selectedTestData = tests.find(t => t.id === selectedTest);

        setTestPreview({
          testTitle: selectedTestData?.title,
          duration: selectedTestData?.duration,
          questions: previewData.questions,
          candidateName,
          candidateEmail,
          aiGenerated: true,
          resumeUsed: resumeFile ? 'Newly uploaded' : 'Existing profile'
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate test preview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    setIsSubmitting(true);
    try {
      let resumeUrl = null;

      // First, upload resume if provided
      if (resumeFile && !useExistingResume) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('candidateId', candidateId);
        formData.append('testId', selectedTest);

        // Include pre-extracted text from OCR if available
        if (extractedText) {
          formData.append('extractedText', extractedText);
        }

        const uploadResponse = await fetch('/api/ai/analyze-resume', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          resumeUrl = uploadData.resumeUrl;
        } else {
          console.warn('Resume upload failed, proceeding without it');
        }
      }

      // Assign test with email functionality
      const response = await fetch(`/api/tests/${selectedTest}/assign-with-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          sendEmail,
          companyName,
          resumeUrl // Pass the uploaded resume URL
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign test');
      }

      const result = await response.json();

      if (result.emailSent) {
        alert(`Test assigned successfully! Invitation email sent to ${candidateEmail}`);
      } else {
        alert('Test assigned successfully! (Email not sent - check email configuration)');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning test:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPreview && testPreview) {
    return (
      <Drawer open={true} onOpenChange={(open) => !open && setShowPreview(false)}>
        <DrawerContent className="max-w-4xl">
          <DrawerHeader>
            <DrawerTitle>Test Preview</DrawerTitle>
            <DrawerClose onClick={() => setShowPreview(false)} />
          </DrawerHeader>

          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900">📋 {testPreview.testTitle}</h3>
              <p className="text-blue-700">Duration: {testPreview.duration} minutes</p>
              <p className="text-blue-700">Candidate: {testPreview.candidateName}</p>
              <p className="text-blue-700">AI Generated: {testPreview.aiGenerated ? 'Yes' : 'No'}</p>
              <p className="text-blue-700">Resume Used: {testPreview.resumeUsed}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Sample Questions ({testPreview.questions?.length || 0} total):</h4>
              {testPreview.questions?.slice(0, 3).map((question: any, index: number) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-200 rounded text-sm">
                      {question.type === 'multiple_choice' ? 'MCQ' :
                        question.type === 'code' ? 'Coding' : 'Short Answer'}
                    </span>
                    <span className="text-sm text-gray-600">{question.difficulty}</span>
                  </div>
                  <p className="font-medium">{question.text}</p>
                  {question.type === 'multiple_choice' && question.metadata?.options && (
                    <ul className="mt-2 text-sm text-gray-600">
                      {question.metadata.options.map((option: string, i: number) => (
                        <li key={i}>• {option}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Assignment
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
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
          <DrawerTitle>Assign Test to {candidateName}</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-auto">
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

            {/* Resume Upload Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Resume for AI Question Generation</h3>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    checked={useExistingResume}
                    onChange={() => setUseExistingResume(true)}
                    className="mr-2"
                  />
                  Use job description only (no resume)
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    checked={!useExistingResume}
                    onChange={() => setUseExistingResume(false)}
                    className="mr-2"
                  />
                  Upload resume for this candidate
                </label>

                {!useExistingResume && (
                  <div className="ml-6">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload PDF, DOC, DOCX, or TXT (max 5MB)
                    </p>

                    {resumeFile && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✓ {resumeFile.name} selected
                        </p>
                      </div>
                    )}
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
                Send invitation email to {candidateEmail}
              </label>

              {sendEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name (for email)
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

          <DrawerFooter className="flex-row justify-between">
            <button
              type="button"
              onClick={generateTestPreview}
              disabled={!selectedTest || isSubmitting}
              className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating...' : 'Preview Test'}
            </button>

            <div className="flex space-x-3">
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
                {isSubmitting ? 'Assigning...' : 'Assign Test'}
              </button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
