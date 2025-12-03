'use client';

import { useState, useEffect } from 'react';
import { Candidate } from '@/types';
import AddCandidateDialog from './AddCandidateDialog';
import ImportCandidatesDialog from './ImportCandidatesDialog';

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowImportDialog(true)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Import Candidates
              </button>
              <button 
                onClick={() => setShowAddDialog(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Add Candidate
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  placeholder="Search candidates..."
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                  <option>All</option>
                  <option>Pending</option>
                  <option>Interviewed</option>
                  <option>Selected</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Interview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                          Loading candidates...
                        </td>
                      </tr>
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                          No candidates found. Import or add candidates to get started.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((candidate: Candidate) => (
                        <tr key={candidate.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {candidate.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {candidate.assignments[0]?.test.title || 'No test assigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={
                              `px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${candidate.assignments[0]?.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                candidate.assignments[0]?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`
                            }>
                              {candidate.assignments[0]?.status ? 
                                candidate.assignments[0].status.charAt(0).toUpperCase() + 
                                candidate.assignments[0].status.slice(1) : 
                                'No Status'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {candidate.assignments[0]?.completedAt ? 
                              new Date(candidate.assignments[0].completedAt).toLocaleDateString() : 
                              'Not completed'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => window.location.href = `/interviewer/candidates/${candidate.id}`}
                              className="text-primary hover:text-primary-dark mr-4"
                            >
                              View Profile
                            </button>
                            <button 
                              onClick={() => window.location.href = `/interviewer/tests/new?candidateId=${candidate.id}`}
                              className="text-primary hover:text-primary-dark mr-4"
                            >
                              Assign Test
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to remove this candidate?')) {
                                  try {
                                    const response = await fetch(`/api/candidates/${candidate.id}`, {
                                      method: 'DELETE'
                                    });
                                    if (response.ok) {
                                      fetchCandidates();
                                    } else {
                                      alert('Failed to remove candidate');
                                    }
                                  } catch (error) {
                                    console.error('Error removing candidate:', error);
                                    alert('Failed to remove candidate');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddDialog && (
        <AddCandidateDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchCandidates();
          }}
        />
      )}

      {showImportDialog && (
        <ImportCandidatesDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={() => {
            setShowImportDialog(false);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
}
