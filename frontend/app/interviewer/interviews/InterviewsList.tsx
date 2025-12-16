'use client';

import { useState } from 'react';
import CreateTestDialog from '@/components/tests/CreateTestDialog';
import ImportCandidatesDialog from '@/components/candidates/ImportCandidatesDialog';
import AddCandidateDialog from '@/components/candidates/AddCandidateDialog';
import AssignTestDialog from '@/components/tests/AssignTestDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Test } from '@/types';
import { Calendar, Users, Plus, Upload, TestTube, Eye, UserPlus, Trash2, Clock, CheckCircle, PlayCircle } from 'lucide-react';


export default function InterviewsList({ initialTests }: { initialTests: Test[] }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [tests, setTests] = useState(initialTests);

  const refreshTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error refreshing tests:', error);
    }
  };

  const renderInterviewsTable = (tests: Test[]) => {
    if (tests.length === 0) {
      return (
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No interviews found</h3>
          <p className="text-gray-500 mb-6">Create your first test and assign it to candidates to get started</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Test
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {tests.map((test: Test) => (
          <div key={test.id} className="bg-white shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                    <TestTube className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{test.title}</h3>
                    {test.jobDescription && (
                      <p className="text-gray-600 text-sm">{test.jobDescription}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {test.assignments.length > 0 ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      test.assignments[0].status === 'completed' ? 'bg-green-100 text-green-800' : 
                      test.assignments[0].status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {test.assignments[0].status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                      {test.assignments[0].status === 'in_progress' && <PlayCircle className="h-4 w-4 mr-1" />}
                      {test.assignments[0].status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                      {test.assignments[0].status.charAt(0).toUpperCase() + test.assignments[0].status.slice(1).replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      <Users className="h-4 w-4 mr-1" />
                      Not Assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Candidate Info */}
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                {test.assignments.length > 0 && test.assignments[0].candidate ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {test.assignments[0].candidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {test.assignments[0].candidate.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {test.assignments[0].candidate.email}
                      </div>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      {test.assignments[0]?.startedAt ? 
                        new Date(test.assignments[0].startedAt).toLocaleDateString() : 
                        'Not started'}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mr-3" />
                    <span className="text-gray-500">No candidate assigned to this test</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Duration: {test.duration} minutes
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.location.href = `/interviewer/tests/${test.id}`}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTest(test);
                      setShowAssignDialog(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </button>
                  {test.assignments.length === 0 && (
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this test?')) {
                          try {
                            const response = await fetch(`/api/tests/${test.id}`, {
                              method: 'DELETE'
                            });
                            if (response.ok) {
                              refreshTests();
                            } else {
                              alert('Failed to delete test');
                            }
                          } catch (error) {
                            console.error('Error deleting test:', error);
                            alert('Failed to delete test');
                          }
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent mb-2">
              Interviews
            </h1>
            <p className="text-gray-600">
              Manage your interviews and test assignments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Candidate
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Candidates
            </button>
            <button 
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary-400 text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-400 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2 font-medium transition-all duration-200"
              >
                All Interviews
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-400 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2 font-medium transition-all duration-200"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="in_progress" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-400 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2 font-medium transition-all duration-200"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-400 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-6 py-2 font-medium transition-all duration-200"
              >
                Completed
              </TabsTrigger>
            </TabsList>

              <TabsContent value="all" className="mt-6">
                {renderInterviewsTable(tests)}
              </TabsContent>
              <TabsContent value="pending" className="mt-6">
                {renderInterviewsTable(tests.map(test => ({
                  ...test,
                  assignments: test.assignments.filter(a => a.status === 'pending')
                })))}
              </TabsContent>
              <TabsContent value="in_progress" className="mt-6">
                {renderInterviewsTable(tests.map(test => ({
                  ...test,
                  assignments: test.assignments.filter(a => a.status === 'in_progress')
                })))}
              </TabsContent>
              <TabsContent value="completed" className="mt-6">
                {renderInterviewsTable(tests.map(test => ({
                  ...test,
                  assignments: test.assignments.filter(a => a.status === 'completed')
                })))}
              </TabsContent>
          </Tabs>
        </div>
      </div>

      {showCreateDialog && (
        <CreateTestDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={refreshTests}
        />
      )}
      {showImportDialog && (
        <ImportCandidatesDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={refreshTests}
        />
      )}
      {showAddDialog && (
        <AddCandidateDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={refreshTests}
        />
      )}

      {showAssignDialog && selectedTest && (
        <AssignTestDialog
          test={selectedTest}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedTest(null);
          }}
          onSuccess={() => {
            setShowAssignDialog(false);
            setSelectedTest(null);
            refreshTests();
          }}
        />
      )}
    </div>
  );
}
