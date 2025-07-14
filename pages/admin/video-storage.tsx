import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '@/components/AdminHeader';

interface VideoInfo {
  key: string;
  size: number;
  sizeFormatted: string;
  lastModified: Date;
  storageClass: string;
  url: string;
  ageInDays: number;
  metadata?: Record<string, string>;
}

interface StorageStats {
  totalObjects: number;
  totalSize: number;
  totalSizeFormatted: string;
  estimatedMonthlyCost: number;
  storageBreakdownFormatted: Record<string, { count: number; size: number; sizeFormatted: string }>;
}

const VideoManagementPage: React.FC = () => {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadVideos();
    loadStats();
  }, [filterType]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'list',
        maxResults: '100'
      });
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/videos/storage?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos || []);
      } else {
        console.error('Failed to load videos:', data.error);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/videos/storage?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const deleteSelectedVideos = async () => {
    if (selectedVideos.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedVideos.size} video(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    const deletedKeys: string[] = [];
    const failedKeys: string[] = [];

    const videosToDelete = Array.from(selectedVideos);
    for (const videoKey of videosToDelete) {
      try {
        const response = await fetch('/api/videos/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: videoKey })
        });

        if (response.ok) {
          deletedKeys.push(videoKey);
        } else {
          failedKeys.push(videoKey);
        }
      } catch (error) {
        failedKeys.push(videoKey);
      }
    }

    if (deletedKeys.length > 0) {
      setVideos(prev => prev.filter(v => !deletedKeys.includes(v.key)));
      setSelectedVideos(new Set());
      await loadStats(); // Refresh stats
    }

    if (failedKeys.length > 0) {
      alert(`Failed to delete ${failedKeys.length} videos. Check console for details.`);
    } else {
      alert(`Successfully deleted ${deletedKeys.length} videos.`);
    }

    setDeleteLoading(false);
  };

  const deleteAllTempVideos = async () => {
    if (!confirm('Delete ALL temporary videos? This will permanently remove all videos in the temp folder.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/videos/storage?action=cleanup&dryRun=false&olderThanDays=0');
      const data = await response.json();
      
      if (data.success) {
        alert(`Deleted ${data.deletedCount} temporary videos`);
        await loadVideos();
        await loadStats();
      } else {
        alert('Failed to delete temporary videos');
      }
    } catch (error) {
      console.error('Error deleting temp videos:', error);
      alert('Error deleting temporary videos');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleVideoSelection = (videoKey: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoKey)) {
      newSelected.delete(videoKey);
    } else {
      newSelected.add(videoKey);
    }
    setSelectedVideos(newSelected);
  };

  const selectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map(v => v.key)));
    }
  };

  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case 'size':
        return b.size - a.size;
      case 'name':
        return a.key.localeCompare(b.key);
      default:
        return 0;
    }
  });

  const getVideoType = (key: string): string => {
    if (key.startsWith('renders/')) return 'remotion';
    if (key.includes('/user-generated/')) return 'user-generated';
    if (key.includes('/temp/')) return 'temp';
    return 'other';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video storage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Video Storage Management" 
        subtitle="Manage S3 video storage, monitor usage, and control retention"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Total Videos</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalObjects}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Total Size</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalSizeFormatted}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-yellow-900">${stats.estimatedMonthlyCost}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Storage Classes</p>
                <p className="text-sm text-purple-900">
                  {Object.keys(stats.storageBreakdownFormatted).join(', ') || 'STANDARD'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Videos</option>
                  <option value="remotion">Remotion</option>
                  <option value="user-generated">User Generated</option>
                  <option value="temp">Temporary</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'size' | 'name')}
                  className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="date">Date</option>
                  <option value="size">Size</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                {selectedVideos.size === videos.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={deleteSelectedVideos}
                disabled={selectedVideos.size === 0 || deleteLoading}
                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedVideos.size})`}
              </button>
              
              <button
                onClick={deleteAllTempVideos}
                disabled={deleteLoading}
                className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Delete All Temp
              </button>
            </div>
          </div>
        </div>

        {/* Video List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Videos ({videos.length})
            </h2>
          </div>
          
          {videos.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No videos found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedVideos.size === videos.length && videos.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedVideos.map((video) => (
                    <tr key={video.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVideos.has(video.key)}
                          onChange={() => toggleVideoSelection(video.key)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {video.key.split('/').pop()}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {video.key}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getVideoType(video.key) === 'remotion' ? 'bg-blue-100 text-blue-800' :
                          getVideoType(video.key) === 'user-generated' ? 'bg-green-100 text-green-800' :
                          getVideoType(video.key) === 'temp' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getVideoType(video.key)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {video.sizeFormatted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {video.ageInDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {video.storageClass}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => window.open(video.url, '_blank')}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVideos(new Set([video.key]));
                            deleteSelectedVideos();
                          }}
                          className="text-red-600 hover:text-red-900"
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
    </div>
  );
};

export default VideoManagementPage;
