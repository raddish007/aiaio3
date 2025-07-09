import { useState } from 'react';

export default function TestHelloWorld() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Direct Remotion Lambda call with minimal props
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'df560d13-272c-4b1f-90cd-6bc599656d13', // Use existing template ID
          assets: [], // No assets
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d', // Your user ID
          child_name: 'Test',
          // Override to use a simple composition
          use_simple_composition: true
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unknown error');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Test Hello World Remotion</h1>
      <p>This will render a simple "Hello World" video using the HelloWorld composition.</p>
      
      <button onClick={handleSubmit} disabled={loading} style={{ fontSize: 18, padding: '8px 24px' }}>
        {loading ? 'Submitting...' : 'Submit Hello World Test'}
      </button>
      
      {result && (
        <pre style={{ marginTop: 24, color: 'green' }}>{JSON.stringify(result, null, 2)}</pre>
      )}
      
      {error && (
        <pre style={{ marginTop: 24, color: 'red' }}>{error}</pre>
      )}
      
      <div style={{ marginTop: 32, fontSize: 14, color: '#888' }}>
        <b>Payload:</b>
        <pre>{JSON.stringify({
          template_id: 'df560d13-272c-4b1f-90cd-6bc599656d13',
          assets: [],
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d',
          child_name: 'Test',
          use_simple_composition: true
        }, null, 2)}</pre>
      </div>
    </div>
  );
} 