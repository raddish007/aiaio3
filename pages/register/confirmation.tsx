import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function Confirmation() {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get registration data from localStorage
    const data = localStorage.getItem('registrationData');
    if (!data) {
      router.push('/register');
      return;
    }
    
    const parsedData = JSON.parse(data);
    setRegistrationData(parsedData);
    
    // Create the account when the page loads
    createAccount(parsedData);
  }, [router]);

  const createAccount = async (data: any) => {
    if (accountCreated || isCreatingAccount) return;
    
    setIsCreatingAccount(true);
    setError('');

    try {
      // The user account was already created in step 1, so we just need to:
      // 1. Create the child record
      // 2. Update the user status to 'trial'

      // Create child record
      const childData = {
        parent_id: data.userId,
        name: data.childName,
        age: parseInt(data.age),
        primary_interest: data.interests[0] || 'Other',
        metadata: {
          pronouns: data.pronouns,
          interests: data.interests,
          additionalInfo: data.additionalInfo
        }
      };

      const { error: childError } = await supabase
        .from('children')
        .insert(childData);

      if (childError) {
        console.error('Child creation error:', childError);
        setError('Error saving child information. Please try again.');
        setIsCreatingAccount(false);
        return;
      }

      // Update user subscription_status to 'trial'
      const now = new Date();

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'trial',
          metadata: {
            step_completed: 3,
            full_registration_complete: true,
            child_name: data.childName,
            child_age: data.age,
            child_interests: data.interests,
            lead_source: 'registration_flow',
            registration_status: 'converted',
            converted_at: now.toISOString(),
            trial_started_at: now.toISOString(),
            is_lead: false
          }
        })
        .eq('id', data.userId);

      if (userUpdateError) {
        console.error('User subscription status update error:', userUpdateError);
        setError('Error updating account status. Please try again.');
        setIsCreatingAccount(false);
        return;
      }

      // Success!
      setAccountCreated(true);
      setIsCreatingAccount(false);
      
      // Clean up localStorage
      setTimeout(() => {
        localStorage.removeItem('registrationData');
        localStorage.removeItem('parentInfo');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsCreatingAccount(false);
    }
  };

  if (!registrationData) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/register"
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (isCreatingAccount) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Creating your account...</h1>
          <p className="text-gray-600">Just a moment while we set everything up!</p>
        </div>
      </div>
    );
  }

  if (!registrationData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Welcome to Hippo Polka! - Hippo Polka</title>
        <meta name="description" content="You're all set! Your first personalized videos are on the way." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header */}
        <header className="p-8 pb-4">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="flex items-center">
              <Image
                src="/HippoPolkaLogo.png"
                alt="Hippo Polka"
                width={60}
                height={60}
                className="w-15 h-15"
              />
              <span className="ml-3 text-xl font-bold text-black">Hippo Polka</span>
            </Link>
          </div>
        </header>

        {/* Progress Indicator */}
        <div className="px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <span className="ml-2 text-sm text-gray-500">Your Info</span>
              </div>
              <div className="w-8 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <span className="ml-2 text-sm text-gray-500">Your Child</span>
              </div>
              <div className="w-8 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <span className="ml-2 text-sm font-medium">Done!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                Great news! You're getting your first 2 months of Hippo Polka totally free.
              </h1>
              <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
                No credit card needed right now—we're just thrilled to have you try it.
                <br/><br/>
                Your first personalized video will arrive in the next day or so. We're a small team and review everything to make sure it's perfect for your child!
              </p>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                Have more than one child? You can add them next.
              </p>
            </div>

            {/* Call to Action */}
            <div className="space-y-6">
              <p className="text-xl text-gray-700 mb-8">
                Keep an eye on your inbox (<strong>{registrationData.email}</strong>) for your first video!
              </p>
              
              <Link 
                href="/dashboard"
                className="inline-block bg-black text-white px-12 py-4 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Go to Your Dashboard
              </Link>
            </div>

            {/* Image Section */}
            <div className="flex justify-center mt-12">
              <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/marketing/kid-coloring-dog.png"
                  alt="Child happily coloring with personalized content"
                  fill
                  className="object-cover"
                />
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
                    className="w-15 h-15"
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
