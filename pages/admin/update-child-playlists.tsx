import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UpdateChildPlaylistsAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
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
      const response = await fetch('/api/admin/update-child-playlists', {
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
        setResult(data.message || 'Update complete!');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Update Child Playlists</h1>
        <p className="mb-6 text-gray-600">This will regenerate the video playlists for all children. Only run this after making changes to video assignments or approvals.</p>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Playlists'}
        </button>
        {result && <div className="mt-4 text-green-600">{result}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
} 