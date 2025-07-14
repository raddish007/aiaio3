import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

interface Child {
  id: string;
  name: string;
  age: number;
  icon: string;
  primary_interest?: string;
  profile_photo_url?: string;
  created_at: string;
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
        .eq('parent_id', userId)
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
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/70">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Minimalist Header */}
      <header className="border-b border-black/10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-black/60 hover:text-black transition-colors">
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-light text-black">Account</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-black/60 text-sm">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-black/60 hover:text-black transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Minimalist Tab Navigation */}
        <div className="border-b border-black/10 mb-12">
          <nav className="flex space-x-12">
            <button
              onClick={() => setActiveTab('children')}
              className={`pb-4 text-sm transition-colors ${
                activeTab === 'children'
                  ? 'text-black border-b-2 border-black'
                  : 'text-black/50 hover:text-black/70'
              }`}
            >
              Family ({children.length})
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`pb-4 text-sm transition-colors ${
                activeTab === 'subscription'
                  ? 'text-black border-b-2 border-black'
                  : 'text-black/50 hover:text-black/70'
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'text-black border-b-2 border-black'
                  : 'text-black/50 hover:text-black/70'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-light text-black mb-2">Family Members</h2>
              <p className="text-black/60 text-sm">Your children's profiles and preferences</p>
            </div>

            {children.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {children.map((child) => (
                  <div key={child.id} className="border border-black/10 p-8 hover:border-black/20 transition-colors">
                    <div className="flex items-start space-x-6">
                      {/* Child Avatar */}
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                        {child.icon ? (
                          <Image
                            src={`/${child.icon}`}
                            alt={`${child.name}'s icon`}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <Image
                            src="/icon_bear.png"
                            alt={`${child.name}'s icon`}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        )}
                      </div>
                      
                      {/* Child Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-black mb-1">{child.name}</h3>
                        <div className="space-y-1 text-sm text-black/60">
                          <p>Age {child.age}</p>
                          {child.primary_interest && (
                            <p className="capitalize">Loves {child.primary_interest}</p>
                          )}
                          <p>Member since {new Date(child.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Image
                    src="/icon_bear.png"
                    alt="No children"
                    width={50}
                    height={50}
                    className="object-contain opacity-30"
                  />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">No children added yet</h3>
                <p className="text-black/60 max-w-md mx-auto">
                  Children profiles will appear here once they are added to your account
                </p>
              </div>
            )}
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-light text-black mb-2">Subscription</h2>
              <p className="text-black/60 text-sm">Your current plan details</p>
            </div>
            
            <div className="border border-black/10 p-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">�</span>
                </div>
                <h3 className="text-lg font-medium text-black mb-2">Friends & Family Plan</h3>
                <p className="text-black/60 mb-8">
                  You're currently on the Friends & Family plan with access to personalized videos for your children.
                </p>
                <div className="text-sm text-black/40">
                  <p>Plan management coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-light text-black mb-2">Settings</h2>
              <p className="text-black/60 text-sm">Account preferences and notifications</p>
            </div>
            
            <div className="border border-black/10 p-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-lg font-medium text-black mb-2">Settings Panel</h3>
                <p className="text-black/60 mb-8">
                  Advanced settings and preferences will be available here soon.
                </p>
                <button className="px-8 py-3 border border-black/20 text-black hover:bg-black/5 transition-colors text-sm">
                  Coming Soon
                </button>
                <p className="text-xs text-black/40 mt-4">Email preferences, notifications, and more</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 