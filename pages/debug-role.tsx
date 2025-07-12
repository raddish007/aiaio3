import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function DebugRole() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Auth error: ${authError.message}`);
        setLoading(false);
        return;
      }
      
      if (!user) {
        setError('No user logged in');
        setLoading(false);
        return;
      }
      
      setUser(user);
      
      // Get user role from database
      const { data: dbUserData, error: dbError } = await supabase
        .from('users')
        .select('role, created_at')
        .eq('id', user.id)
        .single();
      
      if (dbError) {
        setError(`Database error: ${dbError.message}`);
        setLoading(false);
        return;
      }
      
      if (!dbUserData) {
        setError('User not found in users table');
        setLoading(false);
        return;
      }
      
      setUserData(dbUserData);
      
      // Check if role is in allowed list
      const allowedRoles = ['content_manager', 'asset_creator', 'video_ops', 'content-manager'];
      const hasAccess = allowedRoles.includes(dbUserData.role);
      
      console.log('Role check:', {
        role: dbUserData.role,
        allowedRoles: allowedRoles,
        hasAccess: hasAccess
      });
      
    } catch (error) {
      setError(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug User Role</h1>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Auth User</h2>
              <div className="space-y-2">
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Created:</strong> {user?.created_at}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Database User</h2>
              <div className="space-y-2">
                <p><strong>Role:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userData?.role || 'No role'}</span></p>
                <p><strong>Created:</strong> {userData?.created_at}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Access Check</h2>
              <div className="space-y-2">
                <p><strong>Allowed Roles:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {['content_manager', 'asset_creator', 'video_ops', 'content-manager'].map(role => (
                    <li key={role} className="font-mono bg-gray-100 px-2 py-1 rounded inline-block mr-2">
                      {role}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <strong>Has Admin Access:</strong> 
                  <span className={`ml-2 px-3 py-1 rounded font-semibold ${
                    ['content_manager', 'asset_creator', 'video_ops', 'content-manager'].includes(userData?.role)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {['content_manager', 'asset_creator', 'video_ops', 'content-manager'].includes(userData?.role) ? 'YES' : 'NO'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Admin Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 