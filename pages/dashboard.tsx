import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AddChildModal from '@/components/AddChildModal';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  created_at: string;
}

interface Content {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    
    // Fetch user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userData) {
      setUserRole(userData.role);
    }
    
    fetchUserData(user.id);
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch children
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);

      if (childrenData) {
        setChildren(childrenData);
      }

      // Fetch content for all children
      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(child => child.id);
        const { data: contentData } = await supabase
          .from('content')
          .select('*')
          .in('child_id', childIds)
          .order('created_at', { ascending: false });

        if (contentData) {
          setContent(contentData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAddChild = () => {
    setShowAddChildModal(true);
  };

  const handleChildAdded = () => {
    // Refresh the children data
    if (user) {
      fetchUserData(user.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterestEmoji = (interest: string) => {
    const emojis: { [key: string]: string } = {
      halloween: '🎃',
      space: '🚀',
      animals: '🐾',
      vehicles: '🚗',
      dinosaurs: '🦕',
      princesses: '👑',
      superheroes: '🦸‍♂️',
      nature: '🌿',
    };
    return emojis[interest] || '🎬';
  };

  const isAdmin = () => {
    return ['content_manager', 'asset_creator', 'video_ops', 'admin'].includes(userRole);
  };

  const handleAdminClick = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - AIAIO</title>
        <meta name="description" content="Your AIAIO dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-primary">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">AIAIO</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.user_metadata?.name || 'Parent'}!</span>
                {isAdmin() && (
                  <button
                    onClick={handleAdminClick}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-primary-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to AIAIO! 🎉
                </h2>
                <p className="text-gray-600">
                  We're creating personalized videos for your children. Your first videos will be ready within 48 hours.
                </p>
              </div>
              {isAdmin() && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Admin Access
                </div>
              )}
            </div>
          </div>

          {/* Children Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Children</h3>
              
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👶</div>
                  <p className="text-gray-600">No children added yet</p>
                  <button 
                    onClick={handleAddChild}
                    className="btn-primary mt-4"
                  >
                    Add Child
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">
                            {getInterestEmoji(child.primary_interest)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{child.name}</h4>
                            <p className="text-sm text-gray-600">
                              {child.age} year{child.age !== 1 ? 's' : ''} old • {child.primary_interest}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => router.push('/child-videos')}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Videos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Status</h3>
              
              {content.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎬</div>
                  <p className="text-gray-600">No content yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Your first videos are being created...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {content.slice(0, 5).map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button 
                onClick={handleAddChild}
                className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-2xl mb-2">👶</div>
                <h4 className="font-medium text-gray-900">Add Another Child</h4>
                <p className="text-sm text-gray-600">Create profiles for siblings</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-2xl mb-2">⚙️</div>
                <h4 className="font-medium text-gray-900">Account Settings</h4>
                <p className="text-sm text-gray-600">Manage your preferences</p>
              </button>
              
              <button 
                onClick={() => router.push('/child-videos')}
                className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="text-2xl mb-2">🎬</div>
                <h4 className="font-medium text-gray-900">Watch Videos</h4>
                <p className="text-sm text-gray-600">View your child's videos</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-2xl mb-2">📧</div>
                <h4 className="font-medium text-gray-900">Contact Support</h4>
                <p className="text-sm text-gray-600">Get help when you need it</p>
              </button>

              {isAdmin() && (
                <button 
                  onClick={handleAdminClick}
                  className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-2xl mb-2">🔧</div>
                  <h4 className="font-medium text-gray-900">Admin Panel</h4>
                  <p className="text-sm text-gray-600">Manage content and assets</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onChildAdded={handleChildAdded}
      />
    </>
  );
} 