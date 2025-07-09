import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  child_id: string;
  episode_id: string;
  content_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at: string;
  error_message: string;
  output_url?: string;
  segments: any[];
  created_at: string;
  metadata: any;
}

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
}

export default function JobMonitoring() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'failed'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, filter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData();
      }, 10000); // Refresh every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
  };

  const fetchData = async () => {
    try {
      // Fetch all children for reference
      const { data: childrenData } = await supabase
        .from('children')
        .select('*');

      if (childrenData) {
        setChildren(childrenData);
      }

      // Fetch jobs
      let query = supabase
        .from('video_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: jobsData } = await query;

      if (jobsData) {
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('video_generation_jobs')
        .update({
          status: 'pending',
          error_message: null,
          started_at: null,
          completed_at: null
        })
        .eq('id', jobId);

      if (error) throw error;

      fetchData();
      alert('Job queued for retry');
    } catch (error) {
      console.error('Error retrying job:', error);
      alert('Error retrying job');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      const { error } = await supabase
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: 'Cancelled by admin',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      fetchData();
      alert('Job cancelled');
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('Error cancelling job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '⏳';
      case 'pending':
        return '⏸️';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDuration = (startedAt: string, completedAt: string) => {
    if (!startedAt || !completedAt) return 'N/A';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Job Monitoring - AIAIO Admin</title>
        <meta name="description" content="Monitor video generation jobs" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/admin" className="text-2xl font-bold text-blue-600 mr-8">
                  AIAIO Admin
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Job Monitoring</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.user_metadata?.name || 'Admin'}!</span>
                <button
                  onClick={() => router.push('/admin')}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Video Generation Jobs</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                    Auto-refresh
                  </label>
                </div>
                <button
                  onClick={fetchData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({jobs.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({jobs.filter(j => j.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress ({jobs.filter(j => j.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed ({jobs.filter(j => j.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'failed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Failed ({jobs.filter(j => j.status === 'failed').length})
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {jobs.map((job) => {
              const child = children.find(c => c.id === job.child_id);
              return (
                <div key={job.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getStatusIcon(job.status)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {child?.name || 'Unknown Child'} - {job.metadata?.content_type || 'Unknown Type'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Job ID: {job.id.slice(0, 8)}... • Created: {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Started:</strong> {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}</p>
                      <p><strong>Completed:</strong> {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not completed'}</p>
                    </div>
                    <div>
                      <p><strong>Duration:</strong> {formatDuration(job.started_at, job.completed_at)}</p>
                      <p><strong>Segments:</strong> {job.segments?.length || 0}</p>
                    </div>
                    <div>
                      {job.status === 'failed' && (
                        <p className="text-red-600"><strong>Error:</strong> {job.error_message}</p>
                      )}
                      {job.output_url && (
                        <div>
                          <p className="text-green-600"><strong>Video Ready!</strong></p>
                          <a 
                            href={job.output_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View Video
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700"
                      >
                        Retry
                      </button>
                    )}
                    {(job.status === 'pending' || job.status === 'in_progress') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">No jobs match the current filter criteria.</p>
            </div>
          )}
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Job ID:</strong> {selectedJob.id}</p>
                      <p><strong>Status:</strong> {selectedJob.status}</p>
                      <p><strong>Created:</strong> {new Date(selectedJob.created_at).toLocaleString()}</p>
                      <p><strong>Started:</strong> {selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : 'Not started'}</p>
                      <p><strong>Completed:</strong> {selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : 'Not completed'}</p>
                      <p><strong>Duration:</strong> {formatDuration(selectedJob.started_at, selectedJob.completed_at)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Content Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Content Type:</strong> {selectedJob.metadata?.content_type || 'Unknown'}</p>
                      <p><strong>Child:</strong> {children.find(c => c.id === selectedJob.child_id)?.name || 'Unknown'}</p>
                      <p><strong>Custom Prompt:</strong> {selectedJob.metadata?.custom_prompt || 'None'}</p>
                      <p><strong>Segments:</strong> {selectedJob.segments?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedJob.error_message && (
                  <div className="mt-6">
                    <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{selectedJob.error_message}</p>
                    </div>
                  </div>
                )}

                {selectedJob.status === 'completed' && selectedJob.output_url && (
                  <div className="mt-6">
                    <h4 className="font-medium text-green-900 mb-2">Output Video</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 mb-2">Video generated successfully!</p>
                      <a 
                        href={selectedJob.output_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Video
                      </a>
                    </div>
                  </div>
                )}

                {selectedJob.segments && selectedJob.segments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Segments</h4>
                    <div className="space-y-2">
                      {selectedJob.segments.map((segment, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm"><strong>Segment {index + 1}:</strong> {segment.title}</p>
                          <p className="text-sm text-gray-600">Duration: {segment.duration}s</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 