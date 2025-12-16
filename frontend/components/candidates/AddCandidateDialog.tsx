'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { useOrganization } from '@/providers/OrganizationProvider';
import { Loader2, UploadCloud, FileText, CheckCircle2, User, Mail } from 'lucide-react';

type AnalysisResult = {
  skills: string[];
  experience: string;
  education: string;
  achievements?: string[];
};

export default function AddCandidateDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { currentOrg } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setResumeFile(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsLoading(true);
    // Don't clear analysis here, we set it on success

    try {
      let response;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('organizationId', currentOrg.id);
        formData.append('resume', resumeFile);

        response = await fetch('/api/candidates', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, organizationId: currentOrg.id, resumeUrl: ''
          })
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add candidate');
      }

      const result = await response.json();

      if (result.candidate?.analysis && Object.keys(result.candidate.analysis).length > 0) {
        setAnalysis(result.candidate.analysis);
      } else {
        // Fallback if no analysis returned but success
        onSuccess?.();
        onClose();
      }

    } catch (error) {
      console.error('Error adding candidate:', error);
      alert(error instanceof Error ? error.message : 'Failed to add candidate. Please try again.');
      setIsLoading(false); // Only stop loading on error, keep loading=true (or switch view) on success? 
      // Actually, if we setAnalysis, we should stop loading to show results.
    } finally {
      if (!analysis) setIsLoading(false); // If we have analysis, we stay in success state
    }
  };

  const handleCloseSuccess = () => {
    onSuccess?.();
    onClose();
  }

  // Success View
  if (analysis) {
    return (
      <Drawer open={true} onOpenChange={(open) => !open && handleCloseSuccess()}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <DrawerTitle>Candidate Added & Analyzed</DrawerTitle>
            </div>
            <DrawerClose onClick={handleCloseSuccess} />
          </DrawerHeader>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                Resume parsed successfully! Here&apos;s what our AI found:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Experience</h4>
                <div className="bg-gray-50 p-3 rounded-md text-gray-900 border border-gray-100">
                  {analysis.experience || 'Not specified'}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills && analysis.skills.length > 0 ? (
                    analysis.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No specific skills detected</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h4>
                <div className="bg-gray-50 p-3 rounded-md text-gray-900 border border-gray-100">
                  {analysis.education || 'Not specified'}
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <button
              onClick={handleCloseSuccess}
              className="w-full px-4 py-2 bg-[#de065d] text-white rounded-md font-medium hover:bg-[#c00054] transition-colors"
              style={{ backgroundColor: '#de065d' }}
            >
              Confirm & Close
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Candidate</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#de065d] focus:ring-[#de065d] sm:text-sm py-2 border"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#de065d] focus:ring-[#de065d] sm:text-sm py-2 border"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume (PDF)</label>

              {!resumeFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-dashed rounded-lg transition-all duration-200 ${isDragging
                    ? 'border-2 border-[#de065d] bg-[#de065d]/5 scale-[1.02]'
                    : 'border-2 border-gray-300 hover:border-[#de065d] bg-gray-50/50'
                    }`}
                >
                  <div className="space-y-1 text-center pointer-events-none">
                    <UploadCloud className={`mx-auto h-12 w-12 transition-colors ${isDragging ? 'text-[#de065d]' : 'text-gray-400'}`} />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-[#de065d] hover:text-[#c00054] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#de065d] pointer-events-auto px-1"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setResumeFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{resumeFile.name}</p>
                      <p className="text-xs text-gray-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-gray-400 hover:text-red-500 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Uploading a resume allows our AI to automatically extract skills, experience, and education for better test recommendations.
              </p>
            </div>
          </div>

          <DrawerFooter className="border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#de065d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!name && !resumeFile)} // Name is required, logic could infer name from resume later but for now require it
              style={{ backgroundColor: isLoading ? '#f3f4f6' : '#de065d', color: isLoading ? '#9ca3af' : 'white' }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium flex items-center justify-center space-x-2 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                'Add Candidate'
              )}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
