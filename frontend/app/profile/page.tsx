'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing resume on component mount
  useEffect(() => {
    const fetchResume = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/profile/resume');
        if (response.ok) {
          const data = await response.json();
          setResumeUrl(data.resumeUrl);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [session?.user?.id]);

  const handleResumeUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/profile/resume', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResumeFile(file);
        setResumeUrl(data.resumeUrl);
        alert('Resume uploaded successfully!');
      } else {
        alert('Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume');
    } finally {
      setIsUploading(false);
    }
  };

  if (!session?.user) {
    return <div>Please log in to access your profile.</div>;
  }

  // Allow students and regular users to access profile
  if (session.user.role !== 'student' && session.user.role !== 'USER' && session.user.role !== 'user') {
    return <div>Access denied. This page is for candidates only.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Resume Upload Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Resume</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload your resume to enable AI-powered job matching and personalized interview questions.
            </p>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="resume-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                    <span>Upload your resume</span>
                    <input
                      id="resume-upload"
                      name="resume-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
                {(resumeFile || resumeUrl) && (
                  <div className="text-sm text-primary space-y-2">
                    <p>
                      {resumeFile ? resumeFile.name : 'Resume'} uploaded successfully
                    </p>
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline block"
                      >
                        View Resume
                      </a>
                    )}
                  </div>
                )}
                {isUploading && (
                  <p className="text-sm text-gray-500">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{session?.user?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{session?.user?.email}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}