import { useState } from 'react';

export default function TestHelloWorldWithImageAndAudio() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastPayload, setLastPayload] = useState<any>(null);

  const backgroundMusicUrl = "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3";
  const testImageUrl = "https://picsum.photos/1920/1080";
  // Use an actual MP3 audio file for letter L testing
  const letterLAudioUrl = "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752095338534_248nvfaZe8BXhKntjmpp.mp3";

  const handleImageOnly = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    const payload = {
      backgroundImageUrl: testImageUrl,
      backgroundMusicUrl: '',
      backgroundMusicVolume: 0.25,
      submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
    };
    
    setLastPayload(payload);
    
    try {
      const response = await fetch('/api/videos/generate-image-and-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleImageWithMusic = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    const payload = {
      backgroundImageUrl: testImageUrl,
      backgroundMusicUrl: backgroundMusicUrl,
      backgroundMusicVolume: 0.25,
      submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
    };
    
    setLastPayload(payload);
    
    try {
      const response = await fetch('/api/videos/generate-image-and-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleImageWithLetterAudio = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    const payload = {
      backgroundImageUrl: testImageUrl,
      backgroundMusicUrl: backgroundMusicUrl,
      backgroundMusicVolume: 0.25,
      letterAudioUrl: letterLAudioUrl,
      letterName: 'L',
      submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
    };
    
    setLastPayload(payload);
    
    try {
      const response = await fetch('/api/videos/generate-image-and-audio-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <h1>Test Hello World with Image and Audio</h1>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Test Assets:</h3>
        <div style={{ marginBottom: 16 }}>
          <strong>Background Image:</strong> {testImageUrl ? '✅ Available' : '❌ Missing'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Background Music:</strong> {backgroundMusicUrl ? '✅ Available' : '❌ Missing'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Letter L Audio:</strong> {letterLAudioUrl ? '✅ Available' : '❌ Missing'}
        </div>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Test Audio (click to verify it works):</h3>
        <div style={{ marginBottom: 8 }}>
          <strong>Background Music:</strong> 
          <audio controls style={{ marginLeft: 10, width: 200 }}>
            <source src={backgroundMusicUrl} type="audio/mpeg" />
          </audio>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Letter L Audio:</strong> 
          <audio controls style={{ marginLeft: 10, width: 200 }}>
            <source src={letterLAudioUrl} type="audio/mpeg" />
          </audio>
        </div>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={handleImageOnly} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', marginRight: 16, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Submitting...' : 'Test Image Only'}
        </button>
        
        <button 
          onClick={handleImageWithMusic} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', marginRight: 16, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Submitting...' : 'Test Image + Background Music'}
        </button>
        
        <button 
          onClick={handleImageWithLetterAudio} 
          disabled={loading} 
          style={{ fontSize: 18, padding: '8px 24px', marginRight: 16, backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Submitting...' : 'Test Image + Music + Letter L'}
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
      
      {lastPayload && (
        <div style={{ marginTop: 32, fontSize: 14, color: '#888' }}>
          <h3>Last Sent Payload:</h3>
          <pre style={{ backgroundColor: '#f8f8f8', padding: 16, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: 32, fontSize: 14, color: '#888' }}>
        <h3>Available Test Data:</h3>
        <pre style={{ backgroundColor: '#f8f8f8', padding: 16, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify({
            backgroundImageUrl: testImageUrl,
            backgroundMusicUrl: backgroundMusicUrl,
            backgroundMusicVolume: 0.25,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 