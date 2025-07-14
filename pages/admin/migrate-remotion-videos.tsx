import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

export default function MigrateRemotionVideos() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Get the current session/access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/migrate-remotion-videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Unknown error');
      } else {
        setResult(data.message || 'Migration complete!');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Migrate Remotion Videos - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Migrate Remotion Videos</h1>
                <p className="mt-2 text-gray-600">
                  Migrate existing Remotion videos to the public S3 bucket with CDN support
                </p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Migration Overview</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h3 className="font-semibold text-blue-900">What this migration does:</h3>
                <ul className="mt-2 text-blue-800 space-y-1">
                  <li>• Copies videos from <code>aiaio-videos</code> to <code>aiaio3-public-videos</code></li>
                  <li>• Updates database URLs to point to the new public bucket</li>
                  <li>• Organizes videos by date and adds migration metadata</li>
                  <li>• Preserves original video files (no deletion)</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h3 className="font-semibold text-yellow-900">Before running:</h3>
                <ul className="mt-2 text-yellow-800 space-y-1">
                  <li>• Ensure AWS credentials have access to both buckets</li>
                  <li>• Verify <code>aiaio3-public-videos</code> bucket exists and is public</li>
                  <li>• Consider setting up CloudFront CDN first for better performance</li>
                  <li>• This operation may take several minutes for many videos</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h3 className="font-semibold text-green-900">After migration:</h3>
                <ul className="mt-2 text-green-800 space-y-1">
                  <li>• Run "Update Child Playlists" to refresh video URLs</li>
                  <li>• Test video playback to ensure everything works</li>
                  <li>• Videos will benefit from CDN acceleration</li>
                  <li>• Old videos in <code>aiaio-videos</code> can be cleaned up later</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={handleMigration}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Migrating Videos...' : 'Start Migration'}
              </button>
              
              {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Migration Successful</p>
                      <p className="mt-1 text-sm text-green-700">{result}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Migration Failed</p>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {(result || error) && (
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => router.push('/admin/update-child-playlists')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Update Child Playlists
                  </button>
                  <button
                    onClick={() => router.push('/video-playback')}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                  >
                    Test Video Playback
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
