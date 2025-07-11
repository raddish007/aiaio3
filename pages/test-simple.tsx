import React from 'react';
import Head from 'next/head';

export default function TestSimple() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Head>
        <title>Simple Test</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <p className="text-green-600">✅ This page is working!</p>
          <p className="mt-2">If you can see this, the routing is working correctly.</p>
        </div>
      </div>
    </div>
  );
} 