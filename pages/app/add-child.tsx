import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function AddChild() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    pronouns: '',
    interests: [] as string[],
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Interest options
  const interestOptions = [
    'Dinosaurs', 'Space', 'Ocean', 'Wild Animals', 'Dogs', 'Cats', 
    'Trucks', 'Trains', 'Princesses', 'Superheroes'
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/signin');
      return;
    }

    setUser(user);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate that at least one interest is selected
    if (formData.interests.length === 0) {
      setError('Please select at least one theme that matches your child.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create child record
      const childData = {
        parent_id: user!.id,
        name: formData.childName,
        age: parseInt(formData.age),
        primary_interest: formData.interests[0] || 'Other',
        metadata: {
          pronouns: formData.pronouns,
          interests: formData.interests,
          additionalInfo: formData.additionalInfo,
          created_at: new Date().toISOString()
        }
      };

      const { error: childError } = await supabase
        .from('children')
        .insert(childData);

      if (childError) {
        console.error('Child creation error:', childError);
        setError('Error saving child information. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Add child error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Add a Child - Hippo Polka</title>
        <meta name="description" content="Add another child to your Hippo Polka account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Image
                  src="/HippoPolkaLogo.png"
                  alt="Hippo and Dog Logo"
                  width={60}
                  height={60}
                  priority
                  className="flex-shrink-0"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-black truncate">Hippo Polka Beta</h1>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="text-black hover:text-gray-600 transition-colors text-sm sm:text-base"
                >
                  Dashboard
                </Link>
                <Link
                  href="/account-management"
                  className="text-black hover:text-gray-600 transition-colors text-sm sm:text-base"
                >
                  Account Settings
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/signin');
                  }}
                  className="text-black hover:text-gray-600 transition-colors text-sm sm:text-base"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Form Section */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                  Add Another Child
                </h1>
                <p className="text-xl text-gray-700 mb-4">
                  Let's personalize videos for another little one.
                </p>
                <p className="text-lg text-gray-600 mb-12">
                  We'll use this info to create personalized videos—by name, by age, and by the things they love most.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="childName" className="block text-lg font-semibold mb-3">
                      Your child's first name
                    </label>
                    <input
                      type="text"
                      id="childName"
                      value={formData.childName}
                      onChange={(e) => setFormData({...formData, childName: e.target.value})}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none"
                      placeholder="Enter your child's name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-lg font-semibold mb-3">
                      Age
                    </label>
                    <select
                      id="age"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none"
                      required
                    >
                      <option value="">Select age</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(age => (
                        <option key={age} value={age}>{age} year{age !== 1 ? 's' : ''} old</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pronouns" className="block text-lg font-semibold mb-3">
                      Pronouns
                    </label>
                    <select
                      id="pronouns"
                      value={formData.pronouns}
                      onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none"
                      required
                    >
                      <option value="">Select pronouns</option>
                      <option value="he/him">He/Him</option>
                      <option value="she/her">She/Her</option>
                      <option value="they/them">They/Them</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold mb-3">
                      Pick a theme that sounds like your child
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {interestOptions.map(interest => (
                        <label
                          key={interest}
                          className={`cursor-pointer p-3 border rounded-xl text-center transition-colors ${
                            formData.interests.includes(interest)
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{interest}</span>
                        </label>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3">
                      If one of these doesn't match, please let us know what else they're into in the section below. We're always adding new themes!
                    </p>
                  </div>

                  <div>
                    <label htmlFor="additionalInfo" className="block text-lg font-semibold mb-3">
                      What else do they love? <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none"
                      placeholder="Favorite characters, special interests, or anything that makes them smile..."
                      rows={3}
                    />
                  </div>

                  <div className="pt-6 space-y-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-black text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding Child...' : 'Add Child'}
                    </button>
                    
                    <Link
                      href="/dashboard"
                      className="block w-full text-center text-gray-600 hover:text-black transition-colors py-2"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>

              {/* Image Section */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-video rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/mom-kid-screen.png"
                    alt="Mother and child enjoying personalized content together"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 