'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TestTube, Plus, Eye, Edit, Users, Calendar, Search, ArrowUpDown, Filter } from 'lucide-react';
import { useOrganization } from '@/providers/OrganizationProvider';


interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: string;
  assignments?: any[];
  _count?: {
    assignments: number;
  };
}

export default function InterviewerTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { currentOrg } = useOrganization();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'a-z', 'z-a'
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query to avoid aggressive API calling
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTests();
  }, [currentOrg, debouncedSearch, sortBy]);

  const fetchTests = async () => {
    if (!currentOrg) {
      setTests([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        organizationId: currentOrg.id,
      });

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      if (sortBy) {
        queryParams.append('sort', sortBy);
      }

      const response = await fetch(`/api/tests?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Test Management
            </h1>
            <p className="mt-2 text-muted-foreground">Create, manage, and assign tests to candidates</p>
          </div>
          <button
            onClick={() => router.push('/interviewer/tests/new')}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Create New Test</span>
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search tests by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-input rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Name (A-Z)</option>
                <option value="z-a">Name (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
            <TestTube className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {debouncedSearch ? 'No tests found' : 'No tests created yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {debouncedSearch
                ? `No tests match "${debouncedSearch}"`
                : 'Get started by creating your first test'}
            </p>
            {!debouncedSearch && (
              <button
                onClick={() => router.push('/interviewer/tests/new')}
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Create Your First Test</span>
              </button>
            )}
            {debouncedSearch && (
              <button
                onClick={() => { setSearchQuery(''); setSortBy('newest'); }}
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-card text-card-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-border group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <TestTube className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/interviewer/tests/${test.id}`)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Test"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/interviewer/tests/${test.id}/edit`)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Test"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {test.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {test.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Duration
                      </div>
                      <span className="font-medium text-foreground">{test.duration} min</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        Assignments
                      </div>
                      <span className="font-medium text-foreground">
                        {test.assignments?.length || test._count?.assignments || 0}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => router.push(`/interviewer/tests/${test.id}/assign`)}
                      className="flex-1 px-4 py-2 text-primary-foreground text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm"
                    >
                      <span>Assign Test</span>
                    </button>
                    <button
                      onClick={() => router.push(`/interviewer/tests/${test.id}/preview`)}
                      className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground border border-input text-sm font-medium rounded-lg hover:bg-secondary/80 transition-all duration-200 shadow-sm"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}