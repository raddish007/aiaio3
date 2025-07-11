import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

interface Prompt {
  id: string;
  asset_type: 'image' | 'audio' | 'video' | 'prompt';
  theme: string;
  style: string | null;
  safe_zone: string | null;
  prompt_text: string;
  created_by: string | null;
  created_at: string;
  status: string;
}

interface PromptFilter {
  asset_type: string;
  theme: string;
  style: string;
  safe_zone: string;
  status: string;
  search: string;
}

export default function PromptManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage] = useState(20);
  
  const [filter, setFilter] = useState<PromptFilter>({
    asset_type: 'all',
    theme: 'all',
    style: 'all',
    safe_zone: 'all',
    status: 'all',
    search: ''
  });

  const [editForm, setEditForm] = useState({
    theme: '',
    style: '',
    safe_zone: '',
    prompt_text: '',
    status: 'pending'
  });

  const router = useRouter();

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has admin role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || !['content_manager', 'asset_creator', 'video_ops'].includes(userProfile.role)) {
        router.push('/');
        return;
      }

      fetchPrompts();
    };

    checkAuth();
  }, [router, currentPage, filter]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('prompts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * perPage, currentPage * perPage - 1);

      // Apply filters
      if (filter.asset_type !== 'all') {
        query = query.eq('asset_type', filter.asset_type);
      }
      if (filter.theme !== 'all') {
        query = query.eq('theme', filter.theme);
      }
      if (filter.style !== 'all') {
        query = query.eq('style', filter.style);
      }
      if (filter.safe_zone !== 'all') {
        query = query.eq('safe_zone', filter.safe_zone);
      }
      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter.search) {
        query = query.ilike('prompt_text', `%${filter.search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      setPrompts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error in fetchPrompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditForm({
      theme: prompt.theme,
      style: prompt.style || '',
      safe_zone: prompt.safe_zone || '',
      prompt_text: prompt.prompt_text,
      status: prompt.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          theme: editForm.theme,
          style: editForm.style || null,
          safe_zone: editForm.safe_zone || null,
          prompt_text: editForm.prompt_text,
          status: editForm.status
        })
        .eq('id', selectedPrompt.id);

      if (error) {
        console.error('Error updating prompt:', error);
        alert('Error updating prompt');
        return;
      }

      setShowModal(false);
      setSelectedPrompt(null);
      fetchPrompts();
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Error updating prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (error) {
        console.error('Error deleting prompt:', error);
        alert('Error deleting prompt');
        return;
      }

      fetchPrompts();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      alert('Error deleting prompt');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = prompts
      .filter((_, index) => (document.getElementById(`prompt-${index}`) as HTMLInputElement)?.checked)
      .map(prompt => prompt.id);

    if (selectedIds.length === 0) {
      alert('Please select prompts to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} prompt(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .in('id', selectedIds);

      if (error) {
        console.error('Error bulk deleting prompts:', error);
        alert('Error deleting prompts');
        return;
      }

      fetchPrompts();
    } catch (error) {
      console.error('Error in handleBulkDelete:', error);
      alert('Error deleting prompts');
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilter({
      asset_type: 'all',
      theme: 'all',
      style: 'all',
      safe_zone: 'all',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / perPage);

  // Get unique values for filter dropdowns
  const uniqueThemes = Array.from(new Set(prompts.map(p => p.theme))).sort();
  const uniqueStyles = Array.from(new Set(prompts.map(p => p.style).filter(Boolean))) as string[];
  const uniqueSafeZones = Array.from(new Set(prompts.map(p => p.safe_zone).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Prompt Management" 
        subtitle="Review, edit, and delete AI-generated prompts"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={filter.asset_type}
                onChange={(e) => setFilter(prev => ({ ...prev, asset_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="prompt">Prompt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={filter.theme}
                onChange={(e) => setFilter(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Themes</option>
                {uniqueThemes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                value={filter.style}
                onChange={(e) => setFilter(prev => ({ ...prev, style: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Styles</option>
                {uniqueStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safe Zone</label>
              <select
                value={filter.safe_zone}
                onChange={(e) => setFilter(prev => ({ ...prev, safe_zone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Safe Zones</option>
                {uniqueSafeZones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search prompt text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset Filters
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {prompts.length} of {totalCount} prompts
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prompts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading prompts...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No prompts found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Theme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Style
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Safe Zone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt Text
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prompts.map((prompt, index) => (
                    <tr key={prompt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          id={`prompt-${index}`}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prompt.asset_type === 'image' ? 'bg-blue-100 text-blue-800' :
                          prompt.asset_type === 'audio' ? 'bg-green-100 text-green-800' :
                          prompt.asset_type === 'video' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prompt.asset_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prompt.theme}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prompt.style || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prompt.safe_zone || '-'}
                      </td>
                      <td className="px-6 py-4 max-w-xs text-sm text-gray-900">
                        <div className="truncate" title={prompt.prompt_text}>
                          {prompt.prompt_text.length > 100 
                            ? `${prompt.prompt_text.substring(0, 100)}...` 
                            : prompt.prompt_text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prompt.status === 'approved' ? 'bg-green-100 text-green-800' :
                          prompt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {prompt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Prompt</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPrompt(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <input
                    type="text"
                    value={editForm.theme}
                    onChange={(e) => setEditForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <input
                    type="text"
                    value={editForm.style}
                    onChange={(e) => setEditForm(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safe Zone</label>
                  <select
                    value={editForm.safe_zone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, safe_zone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None</option>
                    <option value="left_safe">Left Safe</option>
                    <option value="right_safe">Right Safe</option>
                    <option value="center_safe">Center Safe</option>
                    <option value="intro_safe">Intro Safe</option>
                    <option value="outro_safe">Outro Safe</option>
                    <option value="all_ok">All OK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Text</label>
                  <textarea
                    value={editForm.prompt_text}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prompt_text: e.target.value }))}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Enter the prompt text..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {editForm.prompt_text.length} characters
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPrompt(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
