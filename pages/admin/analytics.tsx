import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminHeader from '@/components/AdminHeader';

export default function AdminAnalytics() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    totalAssets: 0,
    approvedAssets: 0,
    pendingAssets: 0,
    rejectedAssets: 0,
    totalVideos: 0,
    pendingVideos: 0,
    completedVideos: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
    fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch user stats
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: childrenCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });

      // Fetch asset stats
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });

      const { count: approvedAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: pendingAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: rejectedAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      // Fetch video stats
      const { count: totalVideos } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

      const { count: pendingVideos } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: completedVideos } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalUsers: usersCount || 0,
        totalChildren: childrenCount || 0,
        totalAssets: totalAssets || 0,
        approvedAssets: approvedAssets || 0,
        pendingAssets: pendingAssets || 0,
        rejectedAssets: rejectedAssets || 0,
        totalVideos: totalVideos || 0,
        pendingVideos: pendingVideos || 0,
        completedVideos: completedVideos || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Analytics" 
        subtitle="View platform statistics and insights"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <span className="text-2xl">👶</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Children</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalChildren}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <span className="text-2xl">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAssets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <span className="text-2xl">🎬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalVideos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Asset Status Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.approvedAssets}</div>
              <div className="text-sm text-gray-600">Approved Assets</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${stats.totalAssets > 0 ? (stats.approvedAssets / stats.totalAssets) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingAssets}</div>
              <div className="text-sm text-gray-600">Pending Assets</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${stats.totalAssets > 0 ? (stats.pendingAssets / stats.totalAssets) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejectedAssets}</div>
              <div className="text-sm text-gray-600">Rejected Assets</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${stats.totalAssets > 0 ? (stats.rejectedAssets / stats.totalAssets) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Status Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingVideos}</div>
              <div className="text-sm text-gray-600">Pending Videos</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${stats.totalVideos > 0 ? (stats.pendingVideos / stats.totalVideos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.completedVideos}</div>
              <div className="text-sm text-gray-600">Completed Videos</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${stats.totalVideos > 0 ? (stats.completedVideos / stats.totalVideos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/assets')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-medium text-gray-900">Review Assets</h3>
              <p className="text-sm text-gray-600">Manage asset approvals</p>
            </button>

            <button
              onClick={() => router.push('/admin/content')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-medium text-gray-900">Create Content</h3>
              <p className="text-sm text-gray-600">Generate new videos</p>
            </button>

            <button
              onClick={() => router.push('/admin/jobs')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900">Monitor Jobs</h3>
              <p className="text-sm text-gray-600">Track video progress</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 