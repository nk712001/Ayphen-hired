'use client';

// Force refresh
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Users, UserPlus, Upload, Eye, TestTube, Trash2, CheckCircle, AlertCircle, XCircle, Calendar, Mail } from 'lucide-react';
import { Candidate } from '@/types';
import AddCandidateDialog from './AddCandidateDialog';
import ImportCandidatesDialog from './ImportCandidatesDialog';
import AssignTestDialog from './AssignTestDialog';
import EnhancedAssignTestDialog from './EnhancedAssignTestDialog';
import BulkAssignTestDialog from './BulkAssignTestDialog';

import { useOrganization } from '@/providers/OrganizationProvider';
import { Loader2 } from 'lucide-react';

export default function CandidatesList() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  // filteredCandidates will now be same as candidates (fetched filtered from server)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [useEnhancedDialog, setUseEnhancedDialog] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchCandidates = async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('organizationId', currentOrg.id);
      params.append('page', page.toString());
      params.append('limit', '10');
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/candidates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates);
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchCandidates();
    } else {
      setCandidates([]);
    }
  }, [currentOrg, page, statusFilter]); // Refetch on filter/page change

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentOrg) fetchCandidates();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Removed client-side filtering effect
  const filteredCandidates = candidates;

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const getSelectedCandidatesData = () => {
    return candidates.filter(c => selectedCandidates.includes(c.id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Candidates
              </h1>
              <p className="text-muted-foreground">Manage and track your candidate pipeline</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedCandidates.length > 0 && (
                <button
                  onClick={() => setShowBulkAssignDialog(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-primary-foreground rounded-lg shadow-sm bg-primary hover:bg-primary/90 transition-opacity text-sm font-medium"
                >
                  <TestTube className="h-4 w-4" />
                  <span>Assign Test to {selectedCandidates.length} Selected</span>
                </button>
              )}
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center space-x-2 px-4 py-2.5 text-primary-foreground rounded-lg shadow-sm bg-primary hover:bg-primary/90 transition-opacity text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                <span>Import Candidates</span>
              </button>
              <button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center space-x-2 px-4 py-2.5 text-primary-foreground rounded-lg shadow-sm bg-primary hover:bg-primary/90 transition-opacity text-sm font-medium"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Candidate</span>
              </button>
            </div>
          </div>
        </div>

        {!currentOrg ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">No Organization Selected</h3>
            <p className="text-yellow-700 dark:text-yellow-300">Please select an organization from the top bar to manage candidates.</p>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>Search</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search candidates by name or email..."
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span>Status</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidates List */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Users className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Candidates ({filteredCandidates.length})</h2>
                      <p className="text-sm text-muted-foreground">Manage your candidate pipeline</p>
                    </div>
                  </div>
                  {filteredCandidates.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-input text-primary focus:ring-primary w-5 h-5 bg-background"
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                        <span className="text-muted-foreground font-medium">Loading candidates...</span>
                      </div>
                    </div>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'No Matching Candidates' : 'No Candidates Yet'}
                      </h3>
                      <p className="text-muted-foreground mb-6 text-sm">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Import or add candidates to get started with your hiring process.'}
                      </p>
                      {!searchTerm && statusFilter === 'all' && (
                        <div className="flex justify-center space-x-3">
                          <button
                            className="flex items-center space-x-2 px-4 py-2 text-primary-foreground rounded-lg shadow-sm bg-primary hover:bg-primary/90 transition-opacity text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Import Candidates</span>
                          </button>
                          <button
                            onClick={() => setShowAddDialog(true)}
                            className="flex items-center space-x-2 px-4 py-2 text-primary-foreground rounded-lg bg-primary hover:bg-primary/90 transition-opacity text-sm"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Add Candidate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCandidates.map((candidate: Candidate) => {
                      const getStatusIcon = (status?: string) => {
                        switch (status) {
                          case 'completed':
                            return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
                          case 'in_progress':
                            return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
                          default:
                            return <XCircle className="h-4 w-4 text-muted-foreground" />;
                        }
                      };

                      const getStatusColor = (status?: string) => {
                        switch (status) {
                          case 'completed':
                            return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50';
                          case 'in_progress':
                            return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50';
                          default:
                            return 'bg-muted text-muted-foreground border-border';
                        }
                      };

                      return (
                        <div
                          key={candidate.id}
                          className={`bg-card rounded-lg p-5 border border-border hover:border-sidebar-accent transition-all ${selectedCandidates.includes(candidate.id) ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.id)}
                                onChange={() => handleSelectCandidate(candidate.id)}
                                className="rounded border-input text-primary focus:ring-primary w-5 h-5 bg-background"
                              />
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-primary font-semibold text-sm">
                                    {candidate.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-foreground truncate">{candidate.name}</h4>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-0.5">
                                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">{candidate.email}</span>
                                </div>
                                <div className="flex items-center flex-wrap gap-3 mt-2">
                                  <div className="flex items-center space-x-1.5">
                                    {getStatusIcon(candidate.assignments?.[0]?.status)}
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded border ${getStatusColor(candidate.assignments?.[0]?.status)}`}>
                                      {candidate.assignments?.[0]?.status ?
                                        candidate.assignments[0].status.charAt(0).toUpperCase() +
                                        candidate.assignments[0].status.slice(1).replace('_', ' ') :
                                        'No Status'}
                                    </span>
                                  </div>
                                  {candidate.assignments?.[0]?.test?.title && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      Test: {candidate.assignments[0].test.title}
                                    </div>
                                  )}
                                  {candidate.assignments?.[0]?.completedAt && (
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Completed: {new Date(candidate.assignments[0].completedAt).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => router.push(`/interviewer/candidates/${candidate.id}`)}
                                className="flex items-center space-x-1 px-3 py-2 bg-background text-foreground border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>
                              {candidate.assignments?.[0] ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    if (isUnassigning) {
                                      console.log('Unassign already in progress, ignoring click');
                                      return;
                                    }

                                    console.log('Unassign button clicked - showing custom dialog');

                                    // Show custom confirmation dialog
                                    setConfirmDialog({
                                      show: true,
                                      title: 'Unassign Test',
                                      message: 'Are you sure you want to unassign this test?',
                                      onConfirm: async () => {
                                        console.log('User confirmed unassign');
                                        setIsUnassigning(true);
                                        setConfirmDialog(null);

                                        try {
                                          console.log('Attempting to unassign test from candidate:', candidate.id);
                                          // Fix: Access test.id instead of testId directly as per API response structure
                                          const testId = candidate.assignments[0].test?.id;
                                          console.log('Test ID:', testId);

                                          if (!testId) {
                                            throw new Error('Test ID not found for assignment');
                                          }

                                          const response = await fetch(`/api/tests/${testId}/unassign`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ candidateId: candidate.id })
                                          });

                                          console.log('Unassign response status:', response.status);

                                          if (response.ok) {
                                            console.log('Unassign successful, refreshing candidates...');
                                            await fetchCandidates();
                                            alert('Test unassigned successfully');
                                          } else {
                                            const data = await response.json().catch(() => ({ error: 'Unknown error' }));
                                            console.error('Unassign failed:', data);
                                            alert(data.error || 'Failed to unassign test');
                                          }
                                        } catch (error) {
                                          console.error('Error unassigning test:', error);
                                          alert(`Failed to unassign test: ${error instanceof Error ? error.message : 'Network error'}`);
                                        } finally {
                                          setIsUnassigning(false);
                                        }
                                      }
                                    });
                                  }}
                                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${candidate.assignments[0].status === 'completed' || isUnassigning
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                  disabled={candidate.assignments[0].status === 'completed' || isUnassigning}
                                  type="button"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>
                                    {isUnassigning ? 'Unassigning...' :
                                      candidate.assignments[0].status === 'completed' ? 'Completed' : 'Unassign'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCandidateId(candidate.id);
                                    setSelectedCandidate(candidate);
                                    setShowAssignDialog(true);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-opacity text-sm font-medium text-primary-foreground shadow-sm"
                                >
                                  <TestTube className="h-4 w-4" />
                                  <span>Assign</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  if (isDeleting) {
                                    console.log('Delete already in progress, ignoring click');
                                    return;
                                  }

                                  console.log('Remove button clicked - showing custom dialog');

                                  // Show custom confirmation dialog
                                  setConfirmDialog({
                                    show: true,
                                    title: 'Remove Candidate',
                                    message: 'Are you sure you want to remove this candidate? This will delete all their test assignments and results.',
                                    onConfirm: async () => {
                                      console.log('User confirmed deletion');
                                      setIsDeleting(true);
                                      setConfirmDialog(null);

                                      try {
                                        console.log('Attempting to delete candidate:', candidate.id);

                                        const response = await fetch(`/api/candidates/${candidate.id}`, {
                                          method: 'DELETE'
                                        });

                                        console.log('Delete response status:', response.status);

                                        if (response.ok) {
                                          const result = await response.json();
                                          console.log('Candidate deletion result:', result);
                                          await fetchCandidates();
                                          alert('Candidate removed successfully');
                                        } else {
                                          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                          console.error('Deletion failed:', errorData);
                                          alert(`Failed to remove candidate: ${errorData.error || 'Unknown error'}`);
                                        }
                                      } catch (error) {
                                        console.error('Error removing candidate:', error);
                                        alert(`Failed to remove candidate: ${error instanceof Error ? error.message : 'Network error'}`);
                                      } finally {
                                        setIsDeleting(false);
                                      }
                                    }
                                  });
                                }}
                                className="flex items-center space-x-1 px-3 py-2 bg-background text-foreground border border-input rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isDeleting}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{isDeleting ? 'Removing...' : 'Remove'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-input rounded disabled:opacity-50 bg-card text-foreground"
                >
                  Previous
                </button>
                <span className="text-sm text-foreground">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-input rounded disabled:opacity-50 bg-card text-foreground"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Custom Confirmation Dialog */}
        {confirmDialog?.show && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">{confirmDialog.title}</h3>
              <p className="text-muted-foreground mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    console.log('User cancelled action');
                    setConfirmDialog(null);
                  }}
                  className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {
        showAddDialog && (
          <AddCandidateDialog
            onClose={() => setShowAddDialog(false)}
            onSuccess={() => {
              setShowAddDialog(false);
              fetchCandidates();
            }}
          />
        )
      }

      {
        showImportDialog && (
          <ImportCandidatesDialog
            onClose={() => setShowImportDialog(false)}
            onSuccess={() => {
              setShowImportDialog(false);
              fetchCandidates();
            }}
          />
        )
      }

      {
        showAssignDialog && selectedCandidateId && selectedCandidate && (
          useEnhancedDialog ? (
            <EnhancedAssignTestDialog
              candidateId={selectedCandidateId}
              candidateName={selectedCandidate.name}
              candidateEmail={selectedCandidate.email}
              onClose={() => {
                setShowAssignDialog(false);
                setSelectedCandidateId(null);
                setSelectedCandidate(null);
              }}
              onSuccess={() => {
                setShowAssignDialog(false);
                setSelectedCandidateId(null);
                setSelectedCandidate(null);
                fetchCandidates();
              }}
            />
          ) : (
            <AssignTestDialog
              candidateId={selectedCandidateId}
              onClose={() => {
                setShowAssignDialog(false);
                setSelectedCandidateId(null);
                setSelectedCandidate(null);
              }}
              onSuccess={() => {
                setShowAssignDialog(false);
                setSelectedCandidateId(null);
                setSelectedCandidate(null);
                fetchCandidates();
              }}
            />
          )
        )
      }

      {
        showBulkAssignDialog && selectedCandidates.length > 0 && (
          <BulkAssignTestDialog
            selectedCandidates={getSelectedCandidatesData()}
            onClose={() => {
              setShowBulkAssignDialog(false);
              setSelectedCandidates([]);
            }}
            onSuccess={() => {
              setShowBulkAssignDialog(false);
              setSelectedCandidates([]);
              fetchCandidates();
            }}
          />
        )
      }
    </div >
  );
}
