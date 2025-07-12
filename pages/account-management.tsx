import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

interface Child {
  id: string;
  name: string;
  icon: string;
  theme: string;
  additional_themes?: string;
}

export default function AccountManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('children');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);
    await loadChildren(user.id);
  };

  const loadChildren = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        console.error('Error loading children:', error);
        return;
      }

      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <Image
                src="/HippoPolkaLogo.png"
                alt="Hippo and Dog Logo"
                width={40}
                height={40}
                priority
              />
              <h1 className="text-2xl font-bold text-black">Account Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('children')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'children'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Family Members ({children.length})
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'children' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">Family Members</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                + Add Child
              </button>
            </div>

            {children.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <div key={child.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto mb-3">
                        <Image
                          src={`/${child.icon}`}
                          alt={`${child.name}'s icon`}
                          width={64}
                          height={64}
                          className="rounded-lg"
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-black">{child.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{child.theme}</p>
                    </div>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        Edit Profile
                      </button>
                      <button className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        View Videos
                      </button>
                      <button className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors">
                        Remove Child
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👶</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h3>
                <p className="text-gray-600 mb-6">Add your first child to get started</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Add Your First Child
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div>
            <h2 className="text-xl font-semibold text-black mb-6">Subscription & Billing</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h3>
              <p className="text-gray-600 mb-6">You're currently on the free plan. Upgrade to unlock premium features.</p>
              <div className="space-y-4">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  View Plans
                </button>
                <p className="text-sm text-gray-500">Billing management coming soon</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold text-black mb-6">Account Settings</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 mb-6">Account settings and preferences management coming soon.</p>
              <div className="space-y-4">
                <button className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                  Coming Soon
                </button>
                <p className="text-sm text-gray-500">Email preferences, notifications, and more</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 