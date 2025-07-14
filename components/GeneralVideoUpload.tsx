import { useState } from 'react';

export default function GeneralVideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    // Get pre-signed URL from API
    const res = await fetch('/api/uoload-video-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, filetype: file.type }),
    });
    const { url, publicUrl } = await res.json();

    // Upload file to S3
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    setPublicUrl(publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {publicUrl && (
        <div>
          <p>Video uploaded! Public URL:</p>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}</a>
        </div>
      )}
    </div>
  );
}