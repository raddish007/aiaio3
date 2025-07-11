import React, { useState } from 'react';
import Head from 'next/head';

export default function TestNameVideoUltraSimple() {
  const [renderId, setRenderId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNameVideoUltraSimple = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/videos/test-name-video-ultra-simple-lambda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: 'Nolan',
        }),
      });

      const data = await response.json();
      console.log('Test response:', data);

      if (data.renderId) {
        setRenderId(data.renderId);
        setStatus({ status: 'submitted', progress: 0 });
      } else {
        setStatus({ error: data.error || 'Failed to start render' });
      }
    } catch (error) {
      console.error('Test error:', error);
      setStatus({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!renderId) return;

    try {
      const response = await fetch(`/api/videos/status/${renderId}`);
      const data = await response.json();
      setStatus(data);

      if (data.status === 'done' && data.outputUrl) {
        console.log('✅ Render completed:', data.outputUrl);
      } else if (data.status === 'error') {
        console.error('❌ Render failed:', data.error);
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Head>
        <title>Test NameVideo Ultra Simple</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test NameVideo Ultra Simple</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <button
            onClick={testNameVideoUltraSimple}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Test NameVideo Ultra Simple'}
          </button>

          {renderId && (
            <button
              onClick={checkStatus}
              className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Check Status
            </button>
          )}
        </div>

        {renderId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Render Status</h2>
            <p><strong>Render ID:</strong> {renderId}</p>
            {status && (
              <div className="mt-4">
                <p><strong>Status:</strong> {status.status}</p>
                {status.progress !== undefined && (
                  <p><strong>Progress:</strong> {status.progress}%</p>
                )}
                {status.error && (
                  <p className="text-red-600"><strong>Error:</strong> {status.error}</p>
                )}
                {status.outputUrl && (
                  <div className="mt-4">
                    <p className="text-green-600"><strong>✅ Success!</strong></p>
                    <video 
                      controls 
                      className="w-full max-w-2xl mt-2"
                      src={status.outputUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Description</h2>
          <p className="mb-4">
            This test uses the <strong>exact same background music</strong> that works in HelloWorldWithImageAndAudio, 
            but in a NameVideo-style composition. This will help us determine if the issue is with:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>The audio files themselves</li>
            <li>The composition structure</li>
            <li>The Lambda environment</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 