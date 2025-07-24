import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface ChildProfile {
  name: string;
  age: number;
  primaryInterest: string;
}

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<'parent' | 'child'>('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication state when component loads
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth state:', user ? 'Authenticated' : 'Not authenticated');
      if (user) {
        console.log('User ID:', user.id);
      }
    };
    checkAuth();
  }, []);
  
  // Parent form state
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Child form state
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

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (parentData.password !== parentData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create parent account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: parentData.email,
        password: parentData.password,
        options: {
          data: {
            name: parentData.name,
            role: 'parent',
          },
        },
      });

      if (error) throw error;

      // The trigger will automatically create the user record
      // No need to manually insert into users table
      
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Create the user record in our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: parentData.email,
            name: parentData.name,
            role: 'parent'
          });

        if (insertError) {
          console.error('Failed to create user record:', insertError);
          throw insertError;
        }

        // Handle authentication
        if (data.session) {
          console.log('User session established');
        } else {
          console.log('No session returned, signing in manually...');
          // Manually sign in the user
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: parentData.email,
            password: parentData.password,
          });
          
          if (signInError) {
            console.error('Sign in error:', signInError);
            throw signInError;
          }
          
          console.log('User signed in successfully');
        }
        
        setStep('child');
        
        // Double-check authentication after step change
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          console.log('Auth check after step change:', user ? 'Authenticated' : 'Not authenticated');
        }, 100);
      } else {
        throw new Error('User creation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
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

      // Trigger initial content generation (we'll implement this later)
      // await triggerInitialContentGeneration(user.id, childData);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error in handleChildSubmit:', err);
      setError(err.message || 'Failed to create child profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - AIAIO</title>
        <meta name="description" content="Create your AIAIO account and set up your child's profile" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-brand-yellow/10 to-white">
        <div className="max-w-md mx-auto pt-12 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-brand-purple">
              AIAIO
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              {step === 'parent' ? 'Create Your Account' : 'Tell Us About Your Child'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'parent' 
                ? 'Join thousands of parents creating personalized content for their children'
                : 'We\'ll use this to create amazing personalized videos'
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'parent' ? 'bg-brand-orange text-white' : 'bg-green-500 text-white'
            }`}>
              ✓
            </div>
            <div className={`w-16 h-1 mx-2 ${
              step === 'parent' ? 'bg-gray-300' : 'bg-brand-orange'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'child' ? 'bg-brand-orange text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Parent Registration Form */}
          {step === 'parent' && (
            <form onSubmit={handleParentSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="input-field"
                  value={parentData.name}
                  onChange={(e) => setParentData({ ...parentData, name: e.target.value })}
                  placeholder="Sarah Johnson"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="input-field"
                  value={parentData.email}
                  onChange={(e) => setParentData({ ...parentData, email: e.target.value })}
                  placeholder="sarah@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={8}
                  className="input-field"
                  value={parentData.password}
                  onChange={(e) => setParentData({ ...parentData, password: e.target.value })}
                  placeholder="Create a secure password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  className="input-field"
                  value={parentData.confirmPassword}
                  onChange={(e) => setParentData({ ...parentData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-brand-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Child Profile Form */}
          {step === 'child' && (
            <form onSubmit={handleChildSubmit} className="space-y-6">
              <div>
                <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  id="childName"
                  required
                  className="input-field"
                  value={childData.name}
                  onChange={(e) => setChildData({ ...childData, name: e.target.value })}
                  placeholder="Nolan"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <select
                  id="age"
                  required
                  className="input-field"
                  value={childData.age}
                  onChange={(e) => setChildData({ ...childData, age: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(age => (
                    <option key={age} value={age}>{age} year{age !== 1 ? 's' : ''} old</option>
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
                          ? 'border-brand-orange bg-brand-orange/10'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interest"
                        value={interest.value}
                        checked={childData.primaryInterest === interest.value}
                        onChange={(e) => setChildData({ ...childData, primaryInterest: e.target.value })}
                        className="sr-only"
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
                    <h4 className="font-medium text-blue-900">Your first videos will be ready in 48 hours!</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      We'll create personalized name videos, bedtime songs, and educational content featuring {childData.name || 'your child'}.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-brand-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? 'Setting Up Profile...' : 'Complete Setup'}
              </button>
            </form>
          )}

          {/* Login link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 