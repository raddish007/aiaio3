import React, { useState } from 'react';

export default function TestNameVideoSimpleFixed() {
  const [renderId, setRenderId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNameVideoSimple = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/videos/test-name-video-simple-lambda', {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Test NameVideo Simple Fixed
        </h1>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Test Controls</h2>
          
          <button
            onClick={testNameVideoSimple}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6b7280' : '#3b82f6',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Starting...' : 'Test NameVideo Simple'}
          </button>

          {renderId && (
            <button
              onClick={checkStatus}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '1rem'
              }}
            >
              Check Status
            </button>
          )}
        </div>

        {renderId && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Render Status</h2>
            <p><strong>Render ID:</strong> {renderId}</p>
            {status && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Status:</strong> {status.status}</p>
                {status.progress !== undefined && (
                  <p><strong>Progress:</strong> {status.progress}%</p>
                )}
                {status.error && (
                  <p style={{ color: '#dc2626' }}><strong>Error:</strong> {status.error}</p>
                )}
                {status.outputUrl && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ color: '#059669' }}><strong>✅ Success!</strong></p>
                    <video 
                      controls 
                      style={{ width: '100%', maxWidth: '42rem', marginTop: '0.5rem' }}
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

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Test Description</h2>
          <p style={{ marginBottom: '1rem' }}>
            This test uses a <strong>simplified NameVideo composition</strong> that includes:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Background music (same as ultra-simple)</li>
            <li>Letter audio for "N" (plays at 5 seconds)</li>
            <li>Simple text display</li>
            <li>No complex timing or multiple audio files</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            This will help us determine if the issue is with:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            <li>Multiple audio files</li>
            <li>Complex audio timing</li>
            <li>Composition structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 