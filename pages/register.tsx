import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear email error when user starts typing
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "row not found" which is what we want
        console.error('Email check error:', error);
        return false;
      }
      
      return !!data; // Return true if user exists
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError('');
    
    // Check if email already exists
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      setEmailError('An account with this email already exists. Please sign in instead.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Save email as a lead immediately in case they don't complete registration
      const leadData = {
        email: formData.email.toLowerCase(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        status: 'step_1_complete',
        source: 'registration_flow',
        created_at: new Date().toISOString(),
        metadata: {
          step_completed: 1,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        }
      };

      const { error: leadError } = await supabase
        .from('leads')
        .upsert(leadData, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (leadError) {
        console.error('Lead save error:', leadError);
        // Don't block the flow if lead saving fails
      }

      // Store parent info in localStorage for the next step
      localStorage.setItem('parentInfo', JSON.stringify(formData));
      
      // Navigate to child info step
      router.push('/register/child-info');
      
    } catch (error) {
      console.error('Registration step 1 error:', error);
      // Still proceed even if lead saving fails
      localStorage.setItem('parentInfo', JSON.stringify(formData));
      router.push('/register/child-info');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Create Your Account - Hippo Polka</title>
        <meta name="description" content="Start your free trial with Hippo Polka" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header */}
        <header className="p-8 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/HippoPolkaLogo.png"
                  alt="Hippo Polka"
                  width={80}
                  height={80}
                  className="w-20 h-20"
                />
                <span className="ml-4 text-2xl font-bold text-black">Hippo Polka</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/signin" className="text-gray-600 hover:text-black transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-4">
              Let's Get Started!
            </h2>
            <p className="text-center text-lg text-gray-700 mb-2">
              You're about to give your child something magical—personalized videos that spark a love of reading.
            </p>
            <p className="text-center text-sm text-gray-500 mb-4">
              We respect your privacy and will never share your information with third parties.
            </p>
            <p className="text-center text-sm text-gray-600 mb-6">
              Step 1 of 3: Tell us about you
            </p>
          
            <div className="text-center mb-4">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/signin" className="font-medium text-black hover:underline">
                  Sign in instead
                </Link>
              </span>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm ${
                      emailError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                >
                  {isLoading ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-8 py-16">
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Logo & Description */}
              <div className="md:col-span-2">
                <div className="flex items-center mb-6">
                  <Image
                    src="/HippoPolkaLogo.png"
                    alt="Hippo Polka"
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-lg"
                  />
                  <span className="ml-4 text-2xl font-bold text-white">Hippo Polka</span>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                  Personalized videos that spark a love of reading. Screen time that actually builds literacy skills.
                </p>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/press" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Border */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                  © 2025 Hippo Polka. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <Link href="/signin" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Sign In
                  </Link>
                  <a href="mailto:hello@hippopolka.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                    hello@hippopolka.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
