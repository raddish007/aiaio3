import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigationItems = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/prompt-generator', label: 'AI Prompts', icon: '🤖' },
    { path: '/admin/prompts', label: 'Prompt Management', icon: '📝' },
    { path: '/admin/ai-generator', label: 'Image Generator', icon: '🎨' },
    { path: '/admin/audio-generator', label: 'Audio Generator', icon: '🎵' },
    { path: '/admin/assets', label: 'Asset Review', icon: '📋' },
    { path: '/admin/lullaby-video-request', label: 'Lullaby Video', icon: '🌙' },
    { path: '/admin/name-video-request', label: 'Name Video', icon: '📝' },
    { path: '/admin/jobs', label: 'Monitor Jobs', icon: '⚙️' },
    { path: '/admin/video-moderation', label: 'Video Moderation', icon: '🔍' },
    { path: '/admin/video-storage', label: 'Video Storage', icon: '💾' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="border-t border-gray-200 -mb-px">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  router.pathname === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
