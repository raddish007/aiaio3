import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function ChildInfo() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    pronouns: '',
    interests: [] as string[],
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentData, setParentData] = useState<any>(null);

  // Interest options
  const interestOptions = [
    'Dinosaurs', 'Space', 'Ocean', 'Wild Animals', 'Dogs', 'Cats', 
    'Trucks', 'Trains', 'Princesses', 'Superheroes'
  ];

  useEffect(() => {
    // Get parent data from localStorage
    const parentInfo = localStorage.getItem('parentInfo');
    if (!parentInfo) {
      router.push('/register');
      return;
    }
    setParentData(JSON.parse(parentInfo));
  }, [router]);

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
    
    // Validate that at least one interest is selected
    if (formData.interests.length === 0) {
      alert('Please select at least one theme that matches your child.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Update user metadata to show they completed step 2
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          metadata: {
            step_completed: 2,
            child_name: formData.childName,
            child_age: formData.age,
            child_interests: formData.interests,
            updated_at: new Date().toISOString(),
            lead_source: 'registration_flow',
            registration_status: 'step_2_complete',
            is_lead: true
          }
        })
        .eq('id', parentData.userId);

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
        // Don't block the flow if user update fails
      }

      // Store child data with parent data for the final confirmation step
      const completeData = {
        ...parentData,
        ...formData,
        step: 'child-info-complete'
      };
      localStorage.setItem('registrationData', JSON.stringify(completeData));
      
      // Navigate to confirmation (where we'll actually create the child record and convert the user)
      router.push('/register/confirmation');
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!parentData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Let's Make It Personal - Hippo Polka</title>
        <meta name="description" content="Tell us about your child to personalize their videos" />
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
              <div className="w-8 h-0.5 bg-black"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span className="ml-2 text-sm font-medium">Your Child</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span className="ml-2 text-sm text-gray-500">Done!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Form Section */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                  Let's Make It Personal
                </h1>
                <p className="text-xl text-gray-700 mb-4">
                  This part's all about your kid.
                </p>
                <p className="text-lg text-gray-600 mb-12">
                  We use this info to personalize your child's videos—by name, by age, and by the things they love most.
                </p>

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

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-black text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Continuing...' : 'Continue to Final Step'}
                    </button>
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
