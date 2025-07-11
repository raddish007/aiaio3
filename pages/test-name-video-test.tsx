import { useState } from 'react';

export default function TestNameVideoTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testNameVideo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/videos/test-name-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to test NameVideo');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test NameVideoTest Composition</h1>
      <p>This test uses the exact same letter audio URLs as the working NameVideo request.</p>
      
      <button 
        onClick={testNameVideo}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test NameVideoTest'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <h3>✅ Test Successful!</h3>
          <p><strong>Render ID:</strong> {result.render_id}</p>
          <p><strong>Output URL:</strong> <a href={result.output_url} target="_blank" rel="noopener noreferrer">{result.output_url}</a></p>
          <p><strong>Composition:</strong> {result.composition}</p>
          <p><strong>Letter Count:</strong> {result.debug_info.letterCount}</p>
          <p><strong>Available Letters:</strong> {result.debug_info.availableLetters.join(', ')}</p>
          
          <h4>Input Props:</h4>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(result.input_props, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 