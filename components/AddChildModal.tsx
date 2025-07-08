import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChildProfile {
  name: string;
  age: number;
  primaryInterest: string;
}

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: () => void;
}

export default function AddChildModal({ isOpen, onClose, onChildAdded }: AddChildModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [childData, setChildData] = useState<ChildProfile>({
    name: '',
    age: 3,
    primaryInterest: 'halloween',
  });

  const interests = [
    { value: 'halloween', label: 'Halloween', emoji: '🎃' },
    { value: 'space', label: 'Space', emoji: '🚀' },
    { value: 'animals', label: 'Animals', emoji: '🐾' },
    { value: 'vehicles', label: 'Vehicles', emoji: '🚗' },
    { value: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
    { value: 'princesses', label: 'Princesses', emoji: '👑' },
    { value: 'superheroes', label: 'Superheroes', emoji: '🦸‍♂️' },
    { value: 'nature', label: 'Nature', emoji: '🌿' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Checking user authentication...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);
      console.log('Creating child profile for:', childData);

      // Create child profile
      const { data: createdChild, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          name: childData.name,
          age: childData.age,
          primary_interest: childData.primaryInterest,
        })
        .select();

      if (childError) {
        console.error('Child creation error:', childError);
        throw childError;
      }

      console.log('Child profile created successfully:', createdChild);

      // Reset form
      setChildData({
        name: '',
        age: 3,
        primaryInterest: 'halloween',
      });

      // Close modal and refresh parent
      onChildAdded();
      onClose();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setChildData({
        name: '',
        age: 3,
        primaryInterest: 'halloween',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add a Child</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                Child's Name
              </label>
              <input
                type="text"
                id="childName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={childData.name}
                onChange={(e) => setChildData({ ...childData, name: e.target.value })}
                placeholder="Enter child's name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <select
                id="age"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={childData.age}
                onChange={(e) => setChildData({ ...childData, age: parseInt(e.target.value) })}
                disabled={loading}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map(age => (
                  <option key={age} value={age}>
                    {age} year{age !== 1 ? 's' : ''} old
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What does your child love most?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {interests.map(interest => (
                  <label
                    key={interest.value}
                    className={`cursor-pointer p-3 border rounded-lg text-center transition-colors ${
                      childData.primaryInterest === interest.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="interest"
                      value={interest.value}
                      checked={childData.primaryInterest === interest.value}
                      onChange={(e) => setChildData({ ...childData, primaryInterest: e.target.value })}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="text-2xl mb-1">{interest.emoji}</div>
                    <div className="text-sm font-medium">{interest.label}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 text-lg mr-3">🎬</div>
                <div>
                  <h4 className="font-medium text-blue-900">Personalized videos coming soon!</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    We'll create amazing videos featuring {childData.name}'s favorite {childData.primaryInterest} theme.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Child...' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 