'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: string;
  uniqueLink: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  test: {
    title: string;
    duration: number;
  };
  candidate: {
    name: string;
    email: string;
  };
  emailSent?: boolean;
  lastActivity?: string;
}

interface AssignmentStatusTrackerProps {
  testId?: string;
  candidateId?: string;
}

export default function AssignmentStatusTracker({ testId, candidateId }: AssignmentStatusTrackerProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignments();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAssignments, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [testId, candidateId]);

  const fetchAssignments = async () => {
    try {
      let url = '/api/test-assignments';
      const params = new URLSearchParams();
      
      if (testId) params.append('testId', testId);
      if (candidateId) params.append('candidateId', candidateId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesFilter = filter === 'all' || assignment.status === filter;
    const matchesSearch = searchTerm === '' || 
      assignment.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.test.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeElapsed = (createdAt: string, completedAt?: string) => {
    const start = new Date(createdAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleResendEmail = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/test-assignments/assignment/${assignmentId}/resend-email`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Email resent successfully');
        fetchAssignments();
      } else {
        alert('Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email');
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) return;
    
    try {
      const response = await fetch(`/api/test-assignments/assignment/${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchAssignments();
      } else {
        alert('Failed to cancel assignment');
      }
    } catch (error) {
      console.error('Error canceling assignment:', error);
      alert('Failed to cancel assignment');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Test Assignments</h2>
          <button
            onClick={fetchAssignments}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {assignments.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.status === 'in_progress').length}
            </div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="divide-y divide-gray-200">
        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No assignments found matching your criteria.
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">{assignment.test.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {assignment.emailSent && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        📧 Email Sent
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{assignment.candidate.name}</span> • {assignment.candidate.email}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                    {assignment.startedAt && (
                      <span>Started: {new Date(assignment.startedAt).toLocaleDateString()}</span>
                    )}
                    {assignment.completedAt && (
                      <span>Completed: {new Date(assignment.completedAt).toLocaleDateString()}</span>
                    )}
                    <span>Duration: {getTimeElapsed(assignment.createdAt, assignment.completedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {assignment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResendEmail(assignment.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Resend Email
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tests/preview/${assignment.uniqueLink}`)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Copy Link
                      </button>
                    </>
                  )}
                  
                  {assignment.status === 'completed' && (
                    <button
                      onClick={() => router.push(`/interviewer/assignments/${assignment.id}/results`)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      View Results
                    </button>
                  )}
                  
                  {assignment.status !== 'completed' && (
                    <button
                      onClick={() => handleCancelAssignment(assignment.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
