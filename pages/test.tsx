import React from 'react';

export default function Test() {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Test Page</h1>
        <p className="text-gray-700 mb-6">If you can see this, Next.js and Tailwind are working!</p>
        
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Test Button 1
          </button>
          
          <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Test Button 2
          </button>
          
          <button className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Test Button 3
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 