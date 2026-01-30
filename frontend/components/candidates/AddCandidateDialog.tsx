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
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <DrawerTitle>Candidate Added & Analyzed</DrawerTitle>
            </div>
            <DrawerClose onClick={handleCloseSuccess} />
          </DrawerHeader>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-300 font-medium">
                Resume parsed successfully! Here&apos;s what our AI found:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience</h4>
                <div className="bg-muted/50 p-3 rounded-md text-foreground border border-border">
                  {analysis.experience || 'Not specified'}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills && analysis.skills.length > 0 ? (
                    analysis.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">No specific skills detected</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Education</h4>
                <div className="bg-muted/50 p-3 rounded-md text-foreground border border-border">
                  {analysis.education || 'Not specified'}
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <button
              onClick={handleCloseSuccess}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-secondary-dark transition-colors"
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
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    className="pl-10 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border placeholder:text-muted-foreground"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    required
                    className="pl-10 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border placeholder:text-muted-foreground"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-foreground mb-2">Resume (PDF)</label>

              {!resumeFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-dashed rounded-lg transition-all duration-200 ${isDragging
                    ? 'border-2 border-primary bg-primary/5 scale-[1.02]'
                    : 'border-2 border-border hover:border-primary bg-muted/30'
                    }`}
                >
                  <div className="space-y-1 text-center pointer-events-none">
                    <UploadCloud className={`mx-auto h-12 w-12 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex text-sm text-foreground justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary pointer-events-auto px-1"
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
                    <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between px-4 py-3 border border-border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-muted-foreground hover:text-destructive text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Uploading a resume allows our AI to automatically extract skills, experience, and education for better test recommendations.
              </p>
            </div>
          </div>

          <DrawerFooter className="border-t border-border bg-muted/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!name && !resumeFile)} // Name is required, logic could infer name from resume later but for now require it
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium flex items-center justify-center space-x-2 min-w-[140px] bg-primary text-primary-foreground hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
