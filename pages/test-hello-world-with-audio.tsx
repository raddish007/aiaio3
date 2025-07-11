import { useState } from 'react';

export default function TestHelloWorldWithAudio() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Test with hardcoded Lorelei audio assets (from your working payload)
  const testAudioAssets = {
    fullName: "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752095338534_248nvfaZe8BXhKntjmpp.mp3",
    letters: {
      "L": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.wav",
      "O": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.wav",
      "R": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104357770_2ff93e56-aeaf-43b3-b07d-3683c77bd7e1.wav",
      "E": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104676467_2dc4b06d-e8c0-49d6-bb3d-06a86efd68dd.wav",
      "I": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104574188_3fe27b50-10a6-4393-a131-290925f60a21.wav"
    }
  };

  const backgroundMusicUrl = "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3";

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/videos/generate-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioAssets: testAudioAssets,
          backgroundMusicUrl: backgroundMusicUrl,
          backgroundMusicVolume: 0.25,
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
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

  const handleBackgroundMusicOnly = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/videos/generate-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundMusicUrl: backgroundMusicUrl,
          backgroundMusicVolume: 0.25,
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
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

  const handleDirectRemotion = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Try calling Remotion Lambda directly with the HelloWorldWithAudio composition
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'audio-test-template', // We'll need to create this
          composition: 'HelloWorld',
          inputProps: {
            audioAssets: testAudioAssets,
            backgroundMusicUrl: backgroundMusicUrl,
            backgroundMusicVolume: 0.25
          },
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
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
      <h1>Test Hello World with Audio</h1>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Test Audio Assets:</h3>
        <div style={{ marginBottom: 16 }}>
          <strong>Full Name Audio:</strong> {testAudioAssets.fullName ? '✅ Lorelei pronunciation' : '❌ Missing'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Letter Audio Count:</strong> {Object.keys(testAudioAssets.letters).length} letters
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Available Letters:</strong> {Object.keys(testAudioAssets.letters).join(', ')}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Background Music:</strong> {backgroundMusicUrl ? '✅ Available' : '❌ Missing'}
        </div>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Test Audio URLs (click to verify they work):</h3>
        <div style={{ marginBottom: 8 }}>
          <strong>Full Name:</strong> 
          <audio controls style={{ marginLeft: 10, width: 200 }}>
            <source src={testAudioAssets.fullName} type="audio/mpeg" />
          </audio>
        </div>
        {Object.entries(testAudioAssets.letters).map(([letter, url]) => (
          <div key={letter} style={{ marginBottom: 8 }}>
            <strong>Letter {letter}:</strong> 
            <audio controls style={{ marginLeft: 10, width: 200 }}>
              <source src={url} type="audio/wav" />
            </audio>
          </div>
        ))}
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={handleBackgroundMusicOnly} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', marginRight: 16, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Submitting...' : 'Test Background Music Only'}
        </button>
        
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', marginRight: 16 }}
        >
          {loading ? 'Submitting...' : 'Test Full Audio (Name + Letters)'}
        </button>
        
        <button 
          onClick={handleDirectRemotion} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px' }}
        >
          {loading ? 'Submitting...' : 'Test Direct Remotion Call'}
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
        <b>Test Payload:</b>
        <pre>{JSON.stringify({
          audioAssets: testAudioAssets,
          backgroundMusicUrl: backgroundMusicUrl,
          backgroundMusicVolume: 0.25,
        }, null, 2)}</pre>
      </div>
    </div>
  );
}