import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface AudioAsset {
  id: string;
  theme: string;
  file_url: string;
  metadata: any;
  created_at: string;
}

interface TrimSettings {
  startTime: number;
  endTime: number;
  duration: number;
  template?: string;
  title?: string;
}

export default function AudioTrimmer() {
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<AudioAsset | null>(null);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({
    startTime: 0,
    endTime: 0,
    duration: 0,
    template: 'general',
    title: '',
  });
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimResult, setTrimResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchAudioAssets();
  }, []);

  useEffect(() => {
    if (selectedAudio && audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', handleAudioLoaded);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleAudioLoaded);
        }
      };
    }
  }, [selectedAudio]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  };

  const fetchAudioAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .not('metadata->audio_data', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio assets:', error);
      setError('Failed to load audio assets');
    } else {
      setAudioAssets(data || []);
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      setTrimSettings({
        startTime: 0,
        endTime: duration,
        duration: duration,
      });
    }
  };

  const handleAudioSelect = (audio: AudioAsset) => {
    setSelectedAudio(audio);
    setTrimResult(null);
    setError(null);
    
    // Set template from original audio if available
    const originalTemplate = audio.metadata?.template || 'general';
    
    // Create a default title from the script or theme
    const defaultTitle = audio.metadata?.script 
      ? (audio.metadata.script.length > 50 ? audio.metadata.script.substring(0, 50) + '...' : audio.metadata.script)
      : audio.theme;
    
    setTrimSettings(prev => ({
      ...prev,
      template: originalTemplate,
      title: defaultTitle,
    }));
  };

  const handleStartTimeChange = (value: number) => {
    setTrimSettings(prev => ({
      ...prev,
      startTime: Math.min(value, prev.endTime - 0.1),
    }));
  };

  const handleEndTimeChange = (value: number) => {
    setTrimSettings(prev => ({
      ...prev,
      endTime: Math.max(value, prev.startTime + 0.1),
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrimAudio = async () => {
    if (!selectedAudio || !selectedAudio.metadata?.audio_data) {
      setError('No audio selected or audio data not available');
      return;
    }

    setIsTrimming(true);
    setError(null);

    try {
      // Use client-side audio trimming for more accuracy
      const trimmedAudioData = await trimAudioClientSide(
        selectedAudio.metadata.audio_data,
        trimSettings.startTime,
        trimSettings.endTime
      );

      const response = await fetch('/api/assets/trim-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAssetId: selectedAudio.id,
          startTime: trimSettings.startTime,
          endTime: trimSettings.endTime,
          originalAudioData: selectedAudio.metadata.audio_data,
          trimmedAudioData: trimmedAudioData,
          theme: selectedAudio.theme,
          template: trimSettings.template,
          title: trimSettings.title,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTrimResult(result);
        // Refresh the audio assets list
        await fetchAudioAssets();
        alert('Audio trimmed successfully!');
      } else {
        const errorMessage = result.details ? `${result.error}: ${result.details}` : result.error;
        setError(`Trimming failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Audio trimming error:', error);
      setError('Trimming failed. Please try again.');
    } finally {
      setIsTrimming(false);
    }
  };

  const trimAudioClientSide = async (audioDataUrl: string, startTime: number, endTime: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create audio element
        const audio = new Audio(audioDataUrl);
        
        audio.oncanplaythrough = async () => {
          try {
            // Decode the audio
            const response = await fetch(audioDataUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Calculate sample positions
            const sampleRate = audioBuffer.sampleRate;
            const startSample = Math.floor(startTime * sampleRate);
            const endSample = Math.floor(endTime * sampleRate);
            const length = endSample - startSample;
            
            // Create new audio buffer for trimmed audio
            const trimmedBuffer = audioContext.createBuffer(
              audioBuffer.numberOfChannels,
              length,
              sampleRate
            );
            
            // Copy the trimmed portion
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
              const channelData = audioBuffer.getChannelData(channel);
              const trimmedData = trimmedBuffer.getChannelData(channel);
              for (let i = 0; i < length; i++) {
                trimmedData[i] = channelData[startSample + i];
              }
            }
            
            // Convert to WAV format
            const wavBlob = audioBufferToWav(trimmedBuffer);
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(wavBlob);
            
          } catch (error) {
            reject(error);
          }
        };
        
        audio.onerror = () => reject(new Error('Failed to load audio'));
        audio.load();
        
      } catch (error) {
        reject(error);
      }
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handlePlaySegment = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = trimSettings.startTime;
      audioRef.current.play();
      
      // Stop at end time
      const checkTime = () => {
        if (audioRef.current && audioRef.current.currentTime >= trimSettings.endTime) {
          audioRef.current.pause();
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      checkTime();
    }
  };

  const handlePlayFullAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handlePlayTrimmedAudio = () => {
    if (trimResult?.audioData) {
      // Create a temporary audio element for the trimmed audio
      const tempAudio = new Audio(trimResult.audioData);
      
      // Set up trim points for the trimmed audio
      tempAudio.currentTime = 0; // Start from beginning since it's already "trimmed"
      tempAudio.play();
      
      // Stop at the trimmed duration
      const checkTime = () => {
        if (tempAudio.currentTime >= (trimSettings.endTime - trimSettings.startTime)) {
          tempAudio.pause();
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      checkTime();
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Audio Trimmer</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/assets')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Back to Assets
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Audio Selection */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Audio to Trim</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {audioAssets.map((audio) => (
                  <div
                    key={audio.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAudio?.id === audio.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAudioSelect(audio)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{audio.theme}</span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            Audio
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(audio.created_at).toLocaleDateString()}
                        </p>
                        {audio.metadata?.script && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            "{audio.metadata.script.substring(0, 100)}..."
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {audioAssets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No audio assets found. Generate some audio first!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Trimming Controls */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trim Audio</h2>
              
              {selectedAudio ? (
                <div className="space-y-4">
                  {/* Tips for Short Audio Files */}
                  {trimSettings.duration > 0 && trimSettings.duration < 60 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>💡 Short Audio Tip:</strong> For files under 1 minute, you can trim to create shorter segments 
                        or use the full audio as-is. The trim metadata will be preserved for playback control.
                      </p>
                    </div>
                  )}
                                        {/* Selected Audio Info */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Selected Audio</h3>
                        <p className="text-sm text-gray-600 mb-2">{selectedAudio.theme}</p>
                        {selectedAudio.metadata?.script && (
                          <p className="text-sm text-gray-700 mb-2">{selectedAudio.metadata.script}</p>
                        )}
                        {selectedAudio.metadata?.template && (
                          <p className="text-sm text-gray-500">
                            Template: <span className="font-medium">{selectedAudio.metadata.template}</span>
                          </p>
                        )}
                      </div>

                                        {/* Audio Player */}
                      {selectedAudio.metadata?.audio_data && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Original Audio</label>
                          <audio
                            ref={audioRef}
                            controls
                            className="w-full"
                            src={selectedAudio.metadata.audio_data}
                          >
                            Your browser does not support the audio element.
                          </audio>
                          
                          {/* Quick Play Controls for Short Files */}
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={handlePlayFullAudio}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              ▶️ Play Full
                            </button>
                            <button
                              onClick={handlePlaySegment}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ▶️ Play Segment
                            </button>
                          </div>
                        </div>
                      )}

                  {/* Title Editing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audio Title
                    </label>
                    <input
                      type="text"
                      value={trimSettings.title}
                      onChange={(e) => setTrimSettings(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a title for the trimmed audio..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be the title of the new audio asset
                    </p>
                  </div>

                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Assignment
                    </label>
                    <select
                      value={trimSettings.template}
                      onChange={(e) => setTrimSettings(prev => ({ ...prev, template: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="lullaby">Lullaby</option>
                      <option value="name_video">Name Video</option>
                      <option value="educational">Educational</option>
                      <option value="storytime">Storytime</option>
                      <option value="playtime">Playtime</option>
                    </select>
                  </div>

                  {/* Trim Controls */}
                  {trimSettings.duration > 0 && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Start Time: {formatTime(trimSettings.startTime)}
                          </label>
                          <span className="text-sm text-gray-500">
                            {trimSettings.duration > 0 ? Math.round((trimSettings.startTime / trimSettings.duration) * 100) : 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={trimSettings.duration}
                          step="0.1"
                          value={trimSettings.startTime}
                          onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            End Time: {formatTime(trimSettings.endTime)}
                          </label>
                          <span className="text-sm text-gray-500">
                            {trimSettings.duration > 0 ? Math.round((trimSettings.endTime / trimSettings.duration) * 100) : 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={trimSettings.duration}
                          step="0.1"
                          value={trimSettings.endTime}
                          onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Segment Duration:</strong> {formatTime(trimSettings.endTime - trimSettings.startTime)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {trimSettings.duration > 0 && (
                            <>
                              <strong>Full Audio:</strong> {formatTime(trimSettings.duration)} | 
                              <strong>Trimmed:</strong> {Math.round(((trimSettings.endTime - trimSettings.startTime) / trimSettings.duration) * 100)}% of original
                            </>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePlaySegment}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          ▶️ Play Segment
                        </button>
                        <button
                          onClick={handleTrimAudio}
                          disabled={isTrimming || (trimSettings.endTime - trimSettings.startTime) < 0.5}
                          className={`px-4 py-2 rounded-md text-sm ${
                            isTrimming || (trimSettings.endTime - trimSettings.startTime) < 0.5
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isTrimming ? 'Trimming...' : '✂️ Trim Audio'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select an audio file from the left panel to start trimming.</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Trim Result */}
              {trimResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Audio Trimmed Successfully!</h3>
                  <div className="text-sm text-green-700">
                    <p>New Asset ID: {trimResult.asset?.id}</p>
                    <p>Duration: {formatTime(trimSettings.endTime - trimSettings.startTime)}</p>
                    {trimResult.audioData && (
                      <div className="mt-2 space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={handlePlayTrimmedAudio}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            ▶️ Play Trimmed Segment
                          </button>
                          <button
                            onClick={() => {
                              const tempAudio = new Audio(trimResult.audioData);
                              tempAudio.play();
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            ▶️ Play Full Audio
                          </button>
                        </div>
                        <audio controls className="w-full">
                          <source src={trimResult.audioData} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <a
                          href={trimResult.audioData}
                          download="trimmed-audio.mp3"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Download Audio
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 