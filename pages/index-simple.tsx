import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HomeSimple() {
  return (
    <>
      <Head>
        <title>AIAIO - Personalized Video Content for Children</title>
        <meta name="description" content="AI-powered personalized video content platform for children." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">AIAIO</h1>
              </div>
              <div className="flex items-center space-x-6">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Personalized Videos for
              <span className="text-blue-600"> Every Child</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered educational content tailored to your child's name, age, and interests. 
              Create engaging videos that make learning fun and personal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Your Free Trial
              </Link>
              <Link 
                href="/test" 
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
              >
                Test Page
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-2">Personalized Content</h3>
              <p className="text-gray-600">
                Videos featuring your child's name, age-appropriate content, and their favorite themes.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">48-Hour Delivery</h3>
              <p className="text-gray-600">
                Get your child's first personalized videos within 48 hours of registration.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Educational Value</h3>
              <p className="text-gray-600">
                Learning disguised as entertainment with letters, numbers, and life skills.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 