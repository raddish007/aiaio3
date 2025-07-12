import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface VideoAssignment {
  id: string; // Assignment ID
  child_id: string;
  child_name: string;
  age: number;
  primary_interest: string;
  parent_email: string;
  template_type: string;
  status: string;
  status_description: string;
  priority: string;
  assigned_at: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  approved_at?: string;
  output_video_url?: string;
  is_overdue: boolean;
}

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_email: string;
}

export default function VideoAssignmentManager() {
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [unassignedChildren, setUnassignedChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    child_id: '',
    template_type: 'lullaby',
    priority: 'normal',
    due_date: '',
    notes: ''
  });

  const templateTypes = ['lullaby', 'letter-hunt', 'name-video', 'educational'];
  const statusTypes = ['assigned', 'in_progress', 'completed', 'approved', 'rejected'];
  const priorityTypes = ['low', 'normal', 'high', 'urgent'];

  useEffect(() => {
    fetchAssignments();
    fetchUnassignedChildren();
  }, [selectedTemplateType, selectedStatus]);

  const fetchAssignments = async () => {
    try {
      let url = '/api/admin/manage-assignments';
      const params = new URLSearchParams();
      
      if (selectedTemplateType !== 'all') {
        params.append('template_type', selectedTemplateType);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAssignments(data.assignments);
      } else {
        throw new Error(data.error || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const fetchUnassignedChildren = async () => {
    try {
      const response = await fetch('/api/admin/video-assignments?templateType=all');
      const data = await response.json();

      if (data.success) {
        setUnassignedChildren(data.childrenMissingVideos.filter((child: any) => 
          child.status === 'unassigned'
        ));
      }
    } catch (error) {
      console.error('Error fetching unassigned children:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/manage-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAssignment,
          assigned_by: 'current-user-id' // TODO: Get from auth context
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setNewAssignment({
          child_id: '',
          template_type: 'lullaby',
          priority: 'normal',
          due_date: '',
          notes: ''
        });
        fetchAssignments();
        fetchUnassignedChildren();
      } else {
        throw new Error(data.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(`Failed to create assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/manage-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          status: newStatus,
          notes,
          updated_by: 'current-user-id' // TODO: Get from auth context
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchAssignments();
      } else {
        throw new Error(data.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert(`Failed to update assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Video Assignment Manager</title>
        </Head>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Assignment Manager</h1>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Video Assignment Manager</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Video Assignment Manager</h1>
            <div className="flex gap-4">
              <Link
                href="/admin/video-status-dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Dashboard
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                New Assignment
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <select
                  value={selectedTemplateType}
                  onChange={(e) => setSelectedTemplateType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Types</option>
                  {templateTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Statuses</option>
                  {statusTypes.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Unassigned Children Alert */}
          {unassignedChildren.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-800 font-semibold mb-2">
                ⚠️ {unassignedChildren.length} children have no video assignments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {unassignedChildren.slice(0, 6).map(child => (
                  <div key={child.id} className="text-sm text-yellow-700">
                    {child.name} (age {child.age})
                  </div>
                ))}
                {unassignedChildren.length > 6 && (
                  <div className="text-sm text-yellow-700">
                    ...and {unassignedChildren.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignments Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Assignments ({assignments.length})
              </h2>
            </div>

            {assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No assignments found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Child
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={`${assignment.child_id}-${assignment.template_type}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.child_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Age {assignment.age}, {assignment.primary_interest}
                            </div>
                            <div className="text-xs text-gray-400">
                              {assignment.parent_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.template_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                            {assignment.status_description}
                          </span>
                          {assignment.is_overdue && (
                            <div className="text-xs text-red-600 mt-1">Overdue</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {assignment.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Start
                            </button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                // Navigate to the appropriate video creation page
                                const templateMap: Record<string, string> = {
                                  'lullaby': '/admin/lullaby-video-request',
                                  'letter-hunt': '/admin/letter-hunt-request',
                                  'name-video': '/admin/name-video-request'
                                };
                                const url = templateMap[assignment.template_type] || '/admin/lullaby-video-request';
                                window.open(`${url}?child_id=${assignment.child_id}&assignment_id=${assignment.id}`, '_blank');
                              }}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              Submit Video
                            </button>
                          )}
                          {assignment.status === 'completed' && (
                            <>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'approved')}
                                className="text-green-600 hover:text-green-800"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'rejected', 'Needs revision')}
                                className="text-red-600 hover:text-red-800"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {assignment.output_video_url && (
                            <a
                              href={assignment.output_video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              View Video
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Assignment Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create New Assignment
                </h3>
                <form onSubmit={createAssignment}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Child
                      </label>
                      <select
                        value={newAssignment.child_id}
                        onChange={(e) => setNewAssignment({...newAssignment, child_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select a child</option>
                        {unassignedChildren.map(child => (
                          <option key={child.id} value={child.id}>
                            {child.name} (age {child.age})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Type
                      </label>
                      <select
                        value={newAssignment.template_type}
                        onChange={(e) => setNewAssignment({...newAssignment, template_type: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {templateTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={newAssignment.priority}
                        onChange={(e) => setNewAssignment({...newAssignment, priority: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {priorityTypes.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={newAssignment.notes}
                        onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
