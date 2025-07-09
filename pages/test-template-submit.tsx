import { useState } from 'react';

export default function TestTemplateSubmit() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded values - replace with real IDs from your DB
  const template_id = 'df560d13-272c-4b1f-90cd-6bc599656d13';
  const asset_id = 'b0556110-b816-4097-a1a6-31b6e96dd824';
  const submitted_by = '1cb80063-9b5f-4fff-84eb-309f12bd247d';
  const child_name = 'Test';

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id,
          assets: [{ asset_id }],
          submitted_by,
          child_name,
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
      <h1>Test Template Submission</h1>
      <button onClick={handleSubmit} disabled={loading} style={{ fontSize: 18, padding: '8px 24px' }}>
        {loading ? 'Submitting...' : 'Submit Hardcoded Template'}
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
          template_id,
          assets: [{ asset_id }],
          submitted_by,
          child_name,
        }, null, 2)}</pre>
        <div>Update the IDs in <code>pages/test-template-submit.tsx</code> to match your DB values.</div>
      </div>
    </div>
  );
} 