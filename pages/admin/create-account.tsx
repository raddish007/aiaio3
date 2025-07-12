import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function CreateAccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Form state
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('parent');
  const [children, setChildren] = useState([
    {
      name: '',
      theme: 'dinosaurs',
      age: 5,
      additionalThemes: '',
      icon: ''
    }
  ]);

  const themes = [
    'dogs', 'cats', 'dinosaurs', 'trucks', 'superheroes', 'princesses', 
    'pirates', 'halloween', 'ocean animals', 'soccer'
  ];

  const icons = [
    'icon_soccer.png', 'icon_guitar.png', 'icon_rocket.png', 'icon_dinosaur.png',
    'icon_truck.png', 'icon_panda.png', 'icon_penguin.png', 'icon_pencil.png',
    'icon_owl.png', 'icon_fox.png', 'icon_bear.png', 'icon_cat.png'
  ];

  useEffect(() => {
    checkAdminAccess();
    // Set a random icon for the first child on component mount
    setChildren(prev => prev.map((child, index) => 
      index === 0 ? { ...child, icon: icons[Math.floor(Math.random() * icons.length)] } : child
    ));
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('User data:', userData);
    console.log('User role:', userData?.role);

    if (!userData || !['content_manager', 'asset_creator', 'video_ops', 'content-manager'].includes(userData.role)) {
      console.log('Access denied - role not in allowed list');
      router.push('/dashboard');
      return;
    }

    setUser(user);
  };

  const generateRandomPassword = () => {
    // Use a simpler character set to avoid potential pattern issues
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setParentPassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Call API endpoint to create account
      const response = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentName,
          parentEmail,
          parentPassword,
          selectedRole,
          children
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setMessage(`Account created successfully! Parent email: ${data.parentEmail}, Password: ${data.parentPassword}, Children created: ${data.childCount}`);
      
      // Reset form
      setParentName('');
      setParentEmail('');
      setParentPassword('');
      setSelectedRole('parent');
      setChildren([
        {
          name: '',
          theme: 'dinosaurs',
          age: 5,
          additionalThemes: '',
          icon: icons[Math.floor(Math.random() * icons.length)]
        }
      ]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Admin Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                onClick={() => router.push('/login')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Parent & Children Accounts</h2>
            <p className="text-gray-600">Set up a new parent account with one or more children's profiles</p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Account Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="parent@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Password
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Generate or enter password"
                    />
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="content_manager">Content Manager</option>
                    <option value="asset_creator">Asset Creator</option>
                    <option value="video_ops">Video Operations</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Children Profiles Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Children Profiles</h3>
              
              {children.map((child, index) => (
                <div key={index}>
                  <div className="border border-gray-200 rounded-lg p-6 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">Child {index + 1}</h4>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChildren(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Child Name
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => setChildren(prev => prev.map((c, i) => 
                            i === index ? { ...c, name: e.target.value } : c
                          ))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Child's name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Theme
                        </label>
                        <select
                          value={child.theme}
                          onChange={(e) => setChildren(prev => prev.map((c, i) => 
                            i === index ? { ...c, theme: e.target.value } : c
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {themes.map((theme) => (
                            <option key={theme} value={theme}>
                              {theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          value={child.age}
                          onChange={(e) => setChildren(prev => prev.map((c, i) => 
                            i === index ? { ...c, age: parseInt(e.target.value) || 5 } : c
                          ))}
                          min="1"
                          max="12"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Theme Interests (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={child.additionalThemes}
                          onChange={(e) => setChildren(prev => prev.map((c, i) => 
                            i === index ? { ...c, additionalThemes: e.target.value } : c
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="space, ocean, animals"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Child Icon
                        </label>
                        <div className="grid grid-cols-6 gap-4">
                          {icons.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setChildren(prev => prev.map((c, i) => 
                                i === index ? { ...c, icon } : c
                              ))}
                              className={`p-2 border-2 rounded-lg transition-colors ${
                                child.icon === icon 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img 
                                src={`/${icon}`} 
                                alt={icon.replace('icon_', '').replace('.png', '')}
                                className="w-8 h-8 mx-auto"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Another Child button below each child */}
                  <div className="text-center mb-6">
                    <button
                      type="button"
                      onClick={() => setChildren(prev => [...prev, {
                        name: '',
                        theme: 'dinosaurs',
                        age: 5,
                        additionalThemes: '',
                        icon: icons[Math.floor(Math.random() * icons.length)]
                      }])}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      + Add Another Child
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 