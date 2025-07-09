import { useState, useEffect } from 'react';

export default function TestHelloWorldWithImage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageAsset, setImageAsset] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  // Fetch an approved image asset from the database
  useEffect(() => {
    const fetchImageAsset = async () => {
      try {
        const response = await fetch('/api/assets/approved-image');
        const data = await response.json();
        
        if (response.ok && data.asset) {
          setImageAsset(data.asset);
        } else {
          setError('No approved image assets found');
        }
      } catch (err: any) {
        setError('Failed to fetch image asset: ' + err.message);
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchImageAsset();
  }, []);

  const handleSubmit = async () => {
    if (!imageAsset) {
      setError('No image asset available');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'df560d13-272c-4b1f-90cd-6bc599656d13', // Use existing template ID
          assets: [{ asset_id: imageAsset.id }], // Include the image asset
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d', // Your user ID
          child_name: 'Test',
          // Use HelloWorldWithImage composition
          use_image_composition: true,
          background_image_url: imageAsset.file_url
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

  if (loadingAsset) {
    return <div style={{ padding: 32 }}>Loading image asset...</div>;
  }

  if (error && !imageAsset) {
    return <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Test Hello World with Image</h1>
      
      {imageAsset && (
        <div style={{ marginBottom: 24 }}>
          <h3>Selected Image Asset:</h3>
          <div style={{ marginBottom: 16 }}>
            <strong>Theme:</strong> {imageAsset.theme}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>File URL:</strong> {imageAsset.file_url}
          </div>
          <div style={{ marginBottom: 16 }}>
            <img 
              src={imageAsset.file_url} 
              alt="Preview" 
              style={{ 
                maxWidth: '300px', 
                maxHeight: '200px', 
                border: '1px solid #ccc',
                borderRadius: '8px'
              }} 
            />
          </div>
        </div>
      )}
      
      <button 
        onClick={handleSubmit} 
        disabled={loading || !imageAsset} 
        style={{ fontSize: 18, padding: '8px 24px' }}
      >
        {loading ? 'Submitting...' : 'Submit Hello World with Image'}
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
          assets: imageAsset ? [{ asset_id: imageAsset.id }] : [],
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d',
          child_name: 'Test',
          use_image_composition: true,
          background_image_url: imageAsset?.file_url
        }, null, 2)}</pre>
      </div>
    </div>
  );
} 