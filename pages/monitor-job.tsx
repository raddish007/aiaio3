import { useState, useEffect } from 'react';

export default function MonitorJob() {
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded render ID from your job
  const renderId = 'tb4exv6dsj';

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/videos/status/${renderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to check status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ padding: 32 }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Job Monitor</h1>
      <div style={{ marginBottom: 16 }}>
        <strong>Render ID:</strong> {renderId}
      </div>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: 24, 
        borderRadius: 8,
        marginBottom: 24
      }}>
        <h3>Status: {jobData?.status}</h3>
        <div style={{ marginBottom: 16 }}>
          <strong>Progress:</strong> {Math.round((jobData?.progress || 0) * 100)}%
        </div>
        
        {jobData?.progress > 0 && (
          <div style={{ 
            width: '100%', 
            height: 20, 
            background: '#ddd', 
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.round((jobData?.progress || 0) * 100)}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
        
        {jobData?.done && (
          <div style={{ marginTop: 16, color: 'green' }}>
            <strong>✅ Complete!</strong>
            {jobData?.output_url && (
              <div style={{ marginTop: 8 }}>
                <a href={jobData.output_url} target="_blank" rel="noopener noreferrer">
                  View Video
                </a>
              </div>
            )}
          </div>
        )}
        
        {jobData?.error && (
          <div style={{ marginTop: 16, color: 'red' }}>
            <strong>❌ Error:</strong> {jobData.error}
          </div>
        )}
      </div>
      
      <div style={{ fontSize: 14, color: '#666' }}>
        <div><strong>Done:</strong> {jobData?.done ? 'Yes' : 'No'}</div>
        <div><strong>Fatal Error:</strong> {jobData?.fatal_error || 'None'}</div>
        <div><strong>Output URL:</strong> {jobData?.output_url || 'Not ready'}</div>
      </div>
      
      <div style={{ marginTop: 24, fontSize: 12, color: '#999' }}>
        Auto-refreshing every 5 seconds...
      </div>
    </div>
  );
} 