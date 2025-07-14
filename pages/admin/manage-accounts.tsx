import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';

interface Child {
  id: string;
  name: string;
  icon?: string;
  primary_interest: string;
  parent_id: string;
  age: number;
  metadata?: {
    additional_themes?: string;
    icon?: string;
    birth_month?: string;
  };
}

interface ParentAccount {
  id: string;
  email: string;
  role: string;
  children: Child[];
}

export default function ManageAccounts() {
  const [user, setUser] = useState<User | null>(null);
  const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<ParentAccount | null>(null);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [showEditChildForm, setShowEditChildForm] = useState(false);
  const [showEditPasswordForm, setShowEditPasswordForm] = useState(false);
  const [showEditAccountForm, setShowEditAccountForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editingParent, setEditingParent] = useState<ParentAccount | null>(null);
  const [newChild, setNewChild] = useState({
    name: '',
    theme: 'dinosaurs',
    age: 5,
    birthMonth: '',
    additionalThemes: '',
    icon: ''
  });
  const [editChild, setEditChild] = useState({
    name: '',
    theme: 'dinosaurs',
    age: 5,
    birthMonth: '',
    additionalThemes: '',
    icon: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

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
    await loadParentAccounts();
  };

  const loadParentAccounts = async () => {
    try {
      // Get all parent accounts
      const { data: parents, error: parentsError } = await supabase
        .from('users')
        .select('id, email, role, name, created_at')
        .eq('role', 'parent')
        .order('email');

      if (parentsError) {
        console.error('Error loading parents:', parentsError);
        return;
      }

      // Get all children
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .order('name');

      if (childrenError) {
        console.error('Error loading children:', childrenError);
        return;
      }

      // Combine parents with their children
      const accountsWithChildren = parents.map(parent => ({
        ...parent,
        children: children.filter(child => child.parent_id === parent.id)
      }));

      setParentAccounts(accountsWithChildren);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!selectedParent || !newChild.name.trim()) {
      setError('Please select a parent and enter a child name');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: childError } = await supabase
        .from('children')
        .insert({
          name: newChild.name,
          primary_interest: newChild.theme,
          parent_id: selectedParent.id,
          age: newChild.age,
          metadata: {
            additional_themes: newChild.additionalThemes,
            icon: newChild.icon,
            birth_month: newChild.birthMonth
          }
        });

      if (childError) {
        throw new Error(`Child creation error: ${childError.message}`);
      }

      setMessage(`Child "${newChild.name}" added successfully to ${selectedParent.email}`);
      
      // Reset form
      setNewChild({
        name: '',
        theme: 'dinosaurs',
        age: 5,
        birthMonth: '',
        additionalThemes: '',
        icon: ''
      });
      setShowAddChildForm(false);
      
      // Reload data
      await loadParentAccounts();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setEditChild({
      name: child.name,
      theme: child.primary_interest,
      age: child.age,
      birthMonth: child.metadata?.birth_month || '',
      additionalThemes: child.metadata?.additional_themes || '',
      icon: child.metadata?.icon || ''
    });
    setShowEditChildForm(true);
  };

  const handleUpdateChild = async () => {
    if (!editingChild || !editChild.name.trim()) {
      setError('Please enter a child name');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: childError } = await supabase
        .from('children')
        .update({
          name: editChild.name,
          primary_interest: editChild.theme,
          age: editChild.age,
          metadata: {
            additional_themes: editChild.additionalThemes,
            icon: editChild.icon,
            birth_month: editChild.birthMonth
          }
        })
        .eq('id', editingChild.id);

      if (childError) {
        throw new Error(`Child update error: ${childError.message}`);
      }

      setMessage(`Child "${editChild.name}" updated successfully`);
      
      // Reset form
      setEditChild({
        name: '',
        theme: 'dinosaurs',
        age: 5,
        birthMonth: '',
        additionalThemes: '',
        icon: ''
      });
      setShowEditChildForm(false);
      setEditingChild(null);
      
      // Reload data
      await loadParentAccounts();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPassword = (parent: ParentAccount) => {
    setEditingParent(parent);
    setNewPassword('');
    setConfirmPassword('');
    setShowEditPasswordForm(true);
  };

  const handleUpdatePassword = async () => {
    if (!editingParent || !newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call API endpoint to update password
      const response = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingParent.id,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setMessage(`Password updated successfully for ${editingParent.email}`);
      
      // Reset form
      setNewPassword('');
      setConfirmPassword('');
      setShowEditPasswordForm(false);
      setEditingParent(null);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = (parent: ParentAccount) => {
    setEditingParent(parent);
    setNewEmail(parent.email);
    setShowEditAccountForm(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingParent || !newEmail.trim()) {
      setError('Please enter a valid email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call API endpoint to update email
      const response = await fetch('/api/admin/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingParent.id,
          newEmail: newEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email');
      }

      setMessage(`Email updated successfully for ${editingParent.email} → ${newEmail}`);
      
      // Update local state
      setParentAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === editingParent.id 
            ? { ...account, email: newEmail }
            : account
        )
      );
      
      // Reset form
      setNewEmail('');
      setShowEditAccountForm(false);
      setEditingParent(null);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to remove ${childName}? This will also delete all their playlists. This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // First, delete all child playlists
      console.log('🗑️ Deleting child playlists for child:', childId);
      const { error: playlistError } = await supabase
        .from('child_playlists')
        .delete()
        .eq('child_id', childId);

      if (playlistError) {
        throw new Error(`Error removing child playlists: ${playlistError.message}`);
      }

      // Then delete the child
      console.log('🗑️ Deleting child:', childId);
      const { error: childError } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (childError) {
        throw new Error(`Error removing child: ${childError.message}`);
      }

      setMessage(`Child "${childName}" and their playlists removed successfully`);
      
      // Reload data
      await loadParentAccounts();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <AdminHeader 
        title="Manage Accounts" 
        subtitle="Add/remove children from existing accounts"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setLoading(true);
              loadParentAccounts();
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
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

        {/* Parent Accounts List */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Parent Accounts</h2>
          
          {parentAccounts.length > 0 ? (
            <div className="space-y-6">
              {parentAccounts.map((parent) => (
                <div key={parent.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{parent.email}</h3>
                      <p className="text-sm text-gray-600">Role: {parent.role}</p>
                      <p className="text-sm text-gray-600">{parent.children.length} children</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAccount(parent)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                      >
                        Edit Account
                      </button>
                      <button
                        onClick={() => handleEditPassword(parent)}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Edit Password
                      </button>
                      <button
                        onClick={() => {
                          setSelectedParent(parent);
                          setShowAddChildForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        + Add Child
                      </button>
                    </div>
                  </div>

                  {/* Children List */}
                  {parent.children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parent.children.map((child) => (
                        <div key={child.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12">
                              {(child.icon || child.metadata?.icon) ? (
                                <Image
                                  src={`/${child.icon || child.metadata?.icon}`}
                                  alt={`${child.name}'s icon`}
                                  width={48}
                                  height={48}
                                  className="rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-500 text-lg">👤</span>
                                </div>
                              )}
                            </div>
                                                      <div>
                            <h4 className="font-medium text-gray-900">{child.name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{child.primary_interest}</p>
                            {child.metadata?.birth_month && (
                              <p className="text-xs text-gray-500 capitalize">
                                Birth month: {child.metadata.birth_month}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditChild(child)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveChild(child.id, child.name)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No children added yet
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parent accounts found</h3>
              <p className="text-gray-600">Create parent accounts first to manage their children</p>
            </div>
          )}
        </div>

        {/* Add Child Modal */}
        {showAddChildForm && selectedParent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add Child to {selectedParent.email}</h3>
                <button
                  onClick={() => {
                    setShowAddChildForm(false);
                    setSelectedParent(null);
                    setNewChild({
                      name: '',
                      theme: 'dinosaurs',
                      age: 5,
                      birthMonth: '',
                      additionalThemes: '',
                      icon: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddChild(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Name
                  </label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild(prev => ({ ...prev, name: e.target.value }))}
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
                    value={newChild.theme}
                    onChange={(e) => setNewChild(prev => ({ ...prev, theme: e.target.value }))}
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
                    value={newChild.age}
                    onChange={(e) => setNewChild(prev => ({ ...prev, age: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Month
                  </label>
                  <select
                    value={newChild.birthMonth}
                    onChange={(e) => setNewChild(prev => ({ ...prev, birthMonth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select birth month</option>
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Theme Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newChild.additionalThemes}
                    onChange={(e) => setNewChild(prev => ({ ...prev, additionalThemes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="space, ocean, animals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewChild(prev => ({ ...prev, icon }))}
                        className={`p-2 border-2 rounded-lg transition-colors ${
                          newChild.icon === icon 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image 
                          src={`/${icon}`} 
                          alt={icon.replace('icon_', '').replace('.png', '')}
                          width={24}
                          height={24}
                          className="mx-auto"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddChildForm(false);
                      setSelectedParent(null);
                      setNewChild({
                        name: '',
                        theme: 'dinosaurs',
                        age: 5,
                        birthMonth: '',
                        additionalThemes: '',
                        icon: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Child'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Child Modal */}
        {showEditChildForm && editingChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Child: {editingChild.name}</h3>
                <button
                  onClick={() => {
                    setShowEditChildForm(false);
                    setEditingChild(null);
                    setEditChild({
                      name: '',
                      theme: 'dinosaurs',
                      age: 5,
                      birthMonth: '',
                      additionalThemes: '',
                      icon: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateChild(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Name
                  </label>
                  <input
                    type="text"
                    value={editChild.name}
                    onChange={(e) => setEditChild(prev => ({ ...prev, name: e.target.value }))}
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
                    value={editChild.theme}
                    onChange={(e) => setEditChild(prev => ({ ...prev, theme: e.target.value }))}
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
                    value={editChild.age}
                    onChange={(e) => setEditChild(prev => ({ ...prev, age: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Month
                  </label>
                  <select
                    value={editChild.birthMonth}
                    onChange={(e) => setEditChild(prev => ({ ...prev, birthMonth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select birth month</option>
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Theme Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editChild.additionalThemes}
                    onChange={(e) => setEditChild(prev => ({ ...prev, additionalThemes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="space, ocean, animals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditChild(prev => ({ ...prev, icon }))}
                        className={`p-2 border-2 rounded-lg transition-colors ${
                          editChild.icon === icon 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image 
                          src={`/${icon}`} 
                          alt={icon.replace('icon_', '').replace('.png', '')}
                          width={24}
                          height={24}
                          className="mx-auto"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditChildForm(false);
                      setEditingChild(null);
                      setEditChild({
                        name: '',
                        theme: 'dinosaurs',
                        age: 5,
                        birthMonth: '',
                        additionalThemes: '',
                        icon: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Child'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditAccountForm && editingParent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Update Account for {editingParent.email}</h3>
                <button
                  onClick={() => {
                    setShowEditAccountForm(false);
                    setEditingParent(null);
                    setNewEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new email address"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditAccountForm(false);
                    setEditingParent(null);
                    setNewEmail('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Password Modal */}
        {showEditPasswordForm && editingParent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Update Password for {editingParent.email}</h3>
                <button
                  onClick={() => {
                    setShowEditPasswordForm(false);
                    setEditingParent(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditPasswordForm(false);
                      setEditingParent(null);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 