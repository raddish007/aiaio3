import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    pendingVideos: 0,
    totalAssets: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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

    // Check if user has admin role
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      router.push('/dashboard');
      return;
    }

    const allowedRoles = ['content_manager', 'asset_creator', 'video_ops', 'content-manager'];
    if (!allowedRoles.includes(userData.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
    fetchAdminData();
  };

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: childrenCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });

      const { count: assetsCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });

      const { count: videosCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalChildren: childrenCount || 0,
        pendingVideos: videosCount || 0,
        totalAssets: assetsCount || 0
      });

      // Fetch recent activity
      const { data: activity } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(activity || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AIAIO Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Creation Tools */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-8 border border-green-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Creation Tools</h2>
            <p className="text-gray-600">AI-powered tools for generating content and assets</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => router.push('/admin/prompt-generator')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-indigo-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Prompts</h3>
                <p className="text-sm text-gray-600">Generate high-quality prompts</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/prompts')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-emerald-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt Management</h3>
                <p className="text-sm text-gray-600">Review, edit, and delete AI prompts</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/ai-generator')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Generator</h3>
                <p className="text-sm text-gray-600">Generate images with fal.ai</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/audio-generator')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-green-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <span className="text-3xl">🎵</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Audio Generator</h3>
                <p className="text-sm text-gray-600">Generate audio with ElevenLabs</p>
              </div>
            </button>
          </div>
        </div>

        {/* Video Production Tools */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 mb-8 border border-purple-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Production Tools</h2>
            <p className="text-gray-600">Create and manage video content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => router.push('/admin/assets')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Review</h3>
                <p className="text-sm text-gray-600">Review and approve submitted assets</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/lullaby-video-request')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-3xl">🌙</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lullaby Video</h3>
                <p className="text-sm text-gray-600">Create personalized lullaby videos</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/name-video-request')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Name Video</h3>
                <p className="text-sm text-gray-600">Create personalized name spelling videos</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/letter-hunt-request')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-orange-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <span className="text-3xl">🔤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Letter Hunt Video</h3>
                <p className="text-sm text-gray-600">Create personalized letter hunt videos</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/video-assignment-manager')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-teal-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Manager</h3>
                <p className="text-sm text-gray-600">Manage child video assignments</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/video-status-dashboard')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-cyan-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 transition-colors">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Status Dashboard</h3>
                <p className="text-sm text-gray-600">Track video assignment status</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/jobs')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-yellow-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                  <span className="text-3xl">⚙️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitor Jobs</h3>
                <p className="text-sm text-gray-600">Track video generation progress</p>
              </div>
            </button>
          </div>
        </div>

        {/* Content Management Tools */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 border border-blue-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Management Tools</h2>
            <p className="text-gray-600">Manage and review existing content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/admin/video-moderation')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-red-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Moderation</h3>
                <p className="text-sm text-gray-600">Review and approve videos</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/video-storage')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-indigo-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Storage</h3>
                <p className="text-sm text-gray-600">Manage S3 video storage and retention</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/analytics')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">View platform statistics</p>
              </div>
            </button>
          </div>
        </div>

        {/* System Management Tools */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 mb-8 border border-orange-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">System Management</h2>
            <p className="text-gray-600">Advanced system and user management tools</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/admin/create-account')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h3>
                <p className="text-sm text-gray-600">Add new parent and child accounts</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/manage-accounts')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-green-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Accounts</h3>
                <p className="text-sm text-gray-600">Add/remove children from existing accounts</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/template-audio')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-3xl">🎵</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Audio</h3>
                <p className="text-sm text-gray-600">Manage reusable audio templates</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/template-images')}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-green-300 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <span className="text-3xl">🖼️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Images</h3>
                <p className="text-sm text-gray-600">Manage reusable image templates</p>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <span className="text-2xl">🎬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Videos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingVideos}</p>
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
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{asset.theme}</h3>
                    <p className="text-sm text-gray-600">
                      Type: {asset.type} | Status: {asset.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    asset.status === 'approved' ? 'bg-green-100 text-green-800' :
                    asset.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}