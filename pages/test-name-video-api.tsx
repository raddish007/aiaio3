import { useState } from 'react';

export default function TestNameVideoAPI() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestAPI = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    // Test payload with the CORRECT structure that the API expects
    const testPayload = {
      childName: 'Nolan',
      childAge: 3,
      childTheme: 'halloween',
      childId: 'test-child-id',
      submitted_by: null,
      introImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752181122763_axekhc80v.png',
      outroImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752181122764_eg5nx1dww.png',
      letterImageUrls: [
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_tqu9kxu47.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_07m3d64cx.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_c4t2b0skf.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_mxymk8qdo.png'
      ],
      // CORRECT: letterAudioUrls as flat object (what the API expects)
      letterAudioUrls: {
        'N': 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.mp3',
        'O': 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.mp3',
        'L': 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.mp3',
        'A': 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.mp3'
      },
      introAudioUrl: null,
      outroAudioUrl: null
    };
    
    try {
      console.log('🚀 Testing NameVideo API with payload:', testPayload);
      
      const response = await fetch('/api/videos/generate-name-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
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
      <h1>Test NameVideo API Directly</h1>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Key Differences:</h3>
        <ul style={{ marginLeft: 20 }}>
          <li>✅ Uses <code>letterAudioUrls</code> (flat object) - what API expects</li>
          <li>❌ NOT <code>audioAssets.letters</code> (nested object) - what was failing</li>
          <li>✅ No placeholder strings</li>
          <li>✅ Direct API test (bypasses frontend)</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={handleTestAPI} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Testing...' : 'Test NameVideo API Directly'}
        </button>
      </div>
      
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: 'green' }}>Success!</h3>
          <pre style={{ color: 'green', backgroundColor: '#f0f0f0', padding: 16 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: 'red' }}>Error:</h3>
          <pre style={{ color: 'red', backgroundColor: '#fff0f0', padding: 16 }}>
            {error}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: 32, fontSize: 14, color: '#888' }}>
        <h3>Test Payload Structure:</h3>
        <pre style={{ backgroundColor: '#f8f8f8', padding: 16, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify({
            childName: 'Nolan',
            letterAudioUrls: {
              'N': 'https://.../letter_N.mp3',
              'O': 'https://.../letter_O.mp3',
              'L': 'https://.../letter_L.mp3',
              'A': 'https://.../letter_A.mp3'
            }
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 