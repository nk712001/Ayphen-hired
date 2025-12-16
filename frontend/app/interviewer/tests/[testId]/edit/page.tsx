'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestQuestionManager from '@/components/tests/TestQuestionManager';
import { Edit, Clock, Camera, FileText, MessageSquare, Code, Save, X, Settings } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  jobDescription?: string;
  duration: number;
  requiresSecondaryCamera: boolean;
}

export default function EditTestPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    jobDescription: '',
    duration: 60,
    requiresSecondaryCamera: false,
    mcqQuestions: 5,
    conversationalQuestions: 3,
    codingQuestions: 2
  });

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`/api/tests/${params.testId}`);
        if (response.ok) {
          const data = await response.json();
          setTest(data.test);
          setFormData({
            title: data.test.title,
            jobDescription: data.test.jobDescription || '',
            duration: data.test.duration,
            requiresSecondaryCamera: data.test.requiresSecondaryCamera,
            mcqQuestions: data.test.mcqQuestions || 5,
            conversationalQuestions: data.test.conversationalQuestions || 3,
            codingQuestions: data.test.codingQuestions || 2
          });
        } else {
          router.push('/interviewer/tests');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        router.push('/interviewer/tests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [params.testId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/tests/${params.testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push(`/interviewer/tests/${params.testId}`);
      }
    } catch (error) {
      console.error('Error updating test:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Edit className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Edit Test</h1>
          </div>
          <p className="text-gray-600">Update test details and configuration</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Test Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm hover:bg-white/80"
                  placeholder="Enter test title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm hover:bg-white/80"
                  placeholder="Describe the job role and requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Duration (minutes)</span>
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 backdrop-blur-sm hover:bg-white/80"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Question Configuration Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900">Question Configuration</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionManager(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                  style={{ color: 'white' }}
                >
                  <Edit className="h-4 w-4 mr-2" style={{ color: 'white' }} />
                  <span style={{ color: 'white' }}>Manage Questions</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm text-blue-900 flex-1">
                    <p className="font-semibold mb-2">Question Management Options:</p>
                    <ul className="space-y-1.5 text-xs">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Question Counts:</strong> Configure AI-generated question quantities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Manual Management:</strong> Create, edit, and organize custom questions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Mixed Approach:</strong> Use both AI and manual questions together</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <label className="text-sm font-semibold text-purple-900">MCQ Questions</label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.mcqQuestions}
                    onChange={(e) => setFormData({ ...formData, mcqQuestions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg font-semibold"
                  />
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <label className="text-sm font-semibold text-green-900">Conversational</label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.conversationalQuestions}
                    onChange={(e) => setFormData({ ...formData, conversationalQuestions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg font-semibold"
                  />
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Code className="h-5 w-5 text-blue-600" />
                    <label className="text-sm font-semibold text-blue-900">Coding</label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.codingQuestions}
                    onChange={(e) => setFormData({ ...formData, codingQuestions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total Questions:</span> {formData.mcqQuestions + formData.conversationalQuestions + formData.codingQuestions}
                  <span className="ml-3 text-gray-500">• AI-generated questions only</span>
                </p>
              </div>
            </div>

            {/* Proctoring Settings Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Proctoring Settings</h2>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresSecondaryCamera"
                    checked={formData.requiresSecondaryCamera}
                    onChange={(e) => setFormData({ ...formData, requiresSecondaryCamera: e.target.checked })}
                    className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="requiresSecondaryCamera" className="ml-3 text-sm font-medium text-gray-900">
                    Require secondary camera for enhanced proctoring
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all duration-200 hover:shadow-md"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5"
                style={{ color: 'white' }}
              >
                <Save className="h-4 w-4 mr-2" style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Question Manager Modal */}
      {showQuestionManager && (
        <TestQuestionManager
          testId={params.testId}
          onClose={() => setShowQuestionManager(false)}
        />
      )}
    </div>
  );
}