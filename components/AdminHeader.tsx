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

  // Define categories and their tools
  const categories = {
    'Content Creation Tools': [
      { path: '/admin/prompt-generator', label: 'AI Prompts', icon: '🤖' },
      { path: '/admin/prompts', label: 'Prompts Manager', icon: '📝' },
      { path: '/admin/ai-generator', label: 'Image Generator', icon: '🎨' },
      { path: '/admin/audio-generator', label: 'Audio Generator', icon: '🎵' },
      { path: '/admin/assets', label: 'Asset Review', icon: '📋' },
    ],
    'Video Production Tools': [
      { path: '/admin/lullaby-video-request', label: 'Lullaby', icon: '🌙' },
      { path: '/admin/name-video-request', label: 'Name', icon: '📝' },
      { path: '/admin/letter-hunt-request', label: 'Letter Hunt', icon: '🔤' },
      { path: '/admin/video-assignment-manager', label: 'Video Creation Assignments', icon: '📋' },
      { path: '/admin/video-status-dashboard', label: 'Video Status Dashboard', icon: '📊' },
      { path: '/admin/jobs', label: 'Video Creation Status Monitoring', icon: '⚙️' },
      { path: '/admin/video-asset-upload', label: 'Video Components Upload Supabase', icon: '📤' },
      { path: '/admin/general-video-upload', label: 'General Video Upload (S3)', icon: '🎬' },
    ],
    'Content Management Tools': [
      { path: '/admin/video-moderation', label: 'Video Moderation', icon: '🔍' },
      { path: '/admin/video-metadata', label: 'Video Metadata Moderation', icon: '📝' },
      { path: '/admin/template-defaults', label: 'Metadata Template Defaults', icon: '⚙️' },
      { path: '/admin/video-publishing', label: 'Video Publishing', icon: '📤' },
      { path: '/admin/video-storage', label: 'Video Storage Management', icon: '💾' },
    ],
    'System Management': [
      { path: '/admin/create-account', label: 'Create Account', icon: '👤' },
      { path: '/admin/manage-accounts', label: 'Manage Accounts', icon: '👥' },
      { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
    ],
    'Archive': [
      { path: '/admin/template-audio', label: 'Template Audio', icon: '🎵' },
      { path: '/admin/template-images', label: 'Template Images', icon: '🖼️' },
    ],
  };

  // Find the current category based on the current path
  const getCurrentCategory = () => {
    for (const [categoryName, tools] of Object.entries(categories)) {
      if (tools.some(tool => tool.path === router.pathname)) {
        return { name: categoryName, tools };
      }
    }
    return null;
  };

  const currentCategory = getCurrentCategory();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
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
        
        {/* Category Navigation */}
        {currentCategory && (
          <div className="border-t border-gray-200 py-4">
            <div className="flex items-center space-x-4 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{currentCategory.name}</h2>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">Admin Dashboard</span>
            </div>
            <nav className="flex space-x-6 overflow-x-auto">
              {currentCategory.tools.map((tool) => (
                <button
                  key={tool.path}
                  onClick={() => router.push(tool.path)}
                  className={`flex items-center space-x-2 py-2 px-3 rounded-md font-medium text-sm whitespace-nowrap transition-colors ${
                    router.pathname === tool.path
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
