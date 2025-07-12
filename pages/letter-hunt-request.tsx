import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import MissingVideoTracker from '../components/MissingVideoTracker';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_id: string;
}

interface AssetStatus {
  type: 'image' | 'audio' | 'video';
  name: string;
  description: string;
  status: 'missing' | 'generating' | 'ready';
  url?: string;
  generatedAt?: string;
}

interface LetterHuntPayload {
  childName: string;
  targetLetter: string;
  assets: {
    titleCard: AssetStatus;
    introVideo: AssetStatus;
    intro2Video: AssetStatus;
    signImage: AssetStatus;
    bookImage: AssetStatus;
    groceryImage: AssetStatus;
    happyDanceVideo: AssetStatus;
    endingImage: AssetStatus;
    // Audio assets
    titleAudio: AssetStatus;
    introAudio: AssetStatus;
    intro2Audio: AssetStatus;
    signAudio: AssetStatus;
    bookAudio: AssetStatus;
    groceryAudio: AssetStatus;
    happyDanceAudio: AssetStatus;
    endingAudio: AssetStatus;
  };
}

export default function LetterHuntRequest() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [targetLetter, setTargetLetter] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [payload, setPayload] = useState<LetterHuntPayload | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  // Handle URL parameters (child_id, assignment_id)
  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (router.query.child_id && children.length > 0) {
      const child = children.find(c => c.id === router.query.child_id);
      if (child) {
        setSelectedChild(child);
        setChildName(child.name);
        // Set default target letter to first letter of child's name
        setTargetLetter(child.name.charAt(0).toUpperCase());
      }
    }
  }, [router.query.child_id, children]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };
  const [loading, setLoading] = useState(false);

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setChildName(child.name);
    // Don't auto-set target letter - let user choose
  };

  const initializePayload = () => {
    const nameToUse = selectedChild?.name || childName;
    if (!nameToUse || !targetLetter) {
      alert('Please enter both child name and target letter');
      return;
    }

    const newPayload: LetterHuntPayload = {
      childName: nameToUse.trim(),
      targetLetter: targetLetter.toUpperCase().trim(),
      assets: {
        // Images
        titleCard: {
          type: 'image',
          name: 'Title Card',
          description: `"${nameToUse}'s Letter Hunt!" title card with monster theme`,
          status: 'missing'
        },
        signImage: {
          type: 'image',
          name: 'Letter on Signs',
          description: `Letter ${targetLetter} on colorful street sign with monster theme`,
          status: 'missing'
        },
        bookImage: {
          type: 'image',
          name: 'Letter on Books',
          description: `Letter ${targetLetter} on children's book cover with monster theme`,
          status: 'missing'
        },
        groceryImage: {
          type: 'image',
          name: 'Letter in Grocery Store',
          description: `Letter ${targetLetter} on grocery store sign/cereal box with monster theme`,
          status: 'missing'
        },
        endingImage: {
          type: 'image',
          name: 'Ending Image',
          description: `Letter ${targetLetter} with monster characters waving goodbye`,
          status: 'missing'
        },
        // Videos
        introVideo: {
          type: 'video',
          name: 'Intro Video',
          description: 'Monster character pointing to giant letter',
          status: 'missing'
        },
        intro2Video: {
          type: 'video',
          name: 'Search Video',
          description: 'Monster searching around playfully',
          status: 'missing'
        },
        happyDanceVideo: {
          type: 'video',
          name: 'Happy Dance Video',
          description: 'Monster doing a joyful dance',
          status: 'missing'
        },
        // Audio assets
        titleAudio: {
          type: 'audio',
          name: 'Title Audio',
          description: `"${nameToUse}'s letter hunt!"`,
          status: 'missing'
        },
        introAudio: {
          type: 'audio',
          name: 'Intro Audio',
          description: `"Today we're looking for the letter ${targetLetter}!"`,
          status: 'missing'
        },
        intro2Audio: {
          type: 'audio',
          name: 'Search Audio',
          description: `"Everywhere you go, look for the letter ${targetLetter}!"`,
          status: 'missing'
        },
        signAudio: {
          type: 'audio',
          name: 'Signs Audio',
          description: '"On signs"',
          status: 'missing'
        },
        bookAudio: {
          type: 'audio',
          name: 'Books Audio',
          description: '"On books"',
          status: 'missing'
        },
        groceryAudio: {
          type: 'audio',
          name: 'Grocery Audio',
          description: '"Even in the grocery store!"',
          status: 'missing'
        },
        happyDanceAudio: {
          type: 'audio',
          name: 'Happy Dance Audio',
          description: '"And when you find your letter, I want you to do a little happy dance!"',
          status: 'missing'
        },
        endingAudio: {
          type: 'audio',
          name: 'Ending Audio',
          description: `"Have fun finding the letter ${targetLetter}, ${nameToUse}!"`,
          status: 'missing'
        }
      }
    };

    setPayload(newPayload);
  };

  const generateAsset = async (assetKey: keyof LetterHuntPayload['assets']) => {
    if (!payload) return;

    const asset = payload.assets[assetKey];
    
    // Update status to generating
    setPayload(prev => prev ? {
      ...prev,
      assets: {
        ...prev.assets,
        [assetKey]: { ...asset, status: 'generating' }
      }
    } : null);

    try {
      // For now, we'll start with generating the title card image
      if (asset.type === 'image' && assetKey === 'titleCard') {
        const response = await fetch('/api/assets/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateType: 'letter-hunt',
            safeZone: 'center_safe',
            theme: 'monsters',
            childName: payload.childName,
            targetLetter: payload.targetLetter,
            assetType: 'titleCard',
            artStyle: '2D Pixar Style',
            ageRange: '3-5'
          })
        });

        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          setPayload(prev => prev ? {
            ...prev,
            assets: {
              ...prev.assets,
              [assetKey]: { 
                ...asset, 
                status: 'ready',
                url: data.imageUrl,
                generatedAt: new Date().toISOString()
              }
            }
          } : null);
        } else {
          throw new Error(data.error || 'Failed to generate image');
        }
      } else {
        // Placeholder for other asset types
        alert(`Generation for ${asset.type} assets coming soon!`);
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            [assetKey]: { ...asset, status: 'missing' }
          }
        } : null);
      }
    } catch (error) {
      console.error('Error generating asset:', error);
      alert(`Failed to generate ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setPayload(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          [assetKey]: { ...asset, status: 'missing' }
        }
      } : null);
    }
  };

  const canSubmitVideo = () => {
    if (!payload) return false;
    return Object.values(payload.assets).every(asset => asset.status === 'ready');
  };

  const submitForVideoGeneration = async () => {
    if (!payload || !canSubmitVideo()) return;

    setLoading(true);
    try {
      // This will be implemented once we have the remotion template ready
      alert('Video generation will be implemented in the next phase!');
      
      // If this was called from an assignment, mark it as completed
      if (router.query.assignment_id) {
        try {
          const assignmentResponse = await fetch('/api/admin/manage-assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignment_id: router.query.assignment_id,
              status: 'completed',
              output_video_url: `https://example.com/letter-hunt-video-${payload.childName}`, // Placeholder URL
              updated_by: 'current-user-id'
            })
          });

          if (assignmentResponse.ok) {
            alert('Letter hunt video submitted! Assignment marked as completed.');
          }
        } catch (assignmentError) {
          console.error('Error updating assignment:', assignmentError);
          // Don't fail the whole operation if assignment update fails
        }
      }
    } catch (error) {
      console.error('Error submitting video:', error);
      alert('Failed to submit video generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Letter Hunt - Create Video</title>
      </Head>
      
      <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ color: '#333', marginBottom: 32 }}>
          Letter Hunt Video Creator
          {router.query.assignment_id && (
            <span style={{ 
              marginLeft: 16, 
              fontSize: '14px', 
              fontWeight: 'normal', 
              color: '#0066cc', 
              backgroundColor: '#e6f3ff', 
              padding: '4px 8px', 
              borderRadius: 4 
            }}>
              Assignment Mode
            </span>
          )}
        </h1>
        
        {/* Missing Video Tracker */}
        <MissingVideoTracker
          videoType="letter-hunt"
          templateName="Letter Hunt"
          className="mb-8"
          onChildSelect={handleChildSelect}
        />
        
        {!payload ? (
          <div style={{ background: '#f9f9f9', padding: 24, borderRadius: 8, marginBottom: 32 }}>
            <h2>Step 1: Video Details</h2>
            
            {selectedChild && (
              <div style={{ 
                background: '#e8f5e8', 
                border: '1px solid #4caf50', 
                borderRadius: 8, 
                padding: 16, 
                marginBottom: 16 
              }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  ✅ Selected Child: {selectedChild.name}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Age {selectedChild.age}, loves {selectedChild.primary_interest}
                </div>
                <button
                  onClick={() => {
                    setSelectedChild(null);
                    setChildName('');
                  }}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid #4caf50', 
                    color: '#2e7d32',
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    fontSize: 12,
                    marginTop: 8,
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Child's Name:
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter child's name or select from tracker above"
                disabled={!!selectedChild}
                style={{ 
                  padding: 8, 
                  fontSize: 16, 
                  width: 300, 
                  borderRadius: 4, 
                  border: '1px solid #ddd',
                  backgroundColor: selectedChild ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Target Letter:
              </label>
              <input
                type="text"
                value={targetLetter}
                onChange={(e) => setTargetLetter(e.target.value.toUpperCase().slice(0, 1))}
                placeholder="Enter target letter"
                maxLength={1}
                style={{ padding: 8, fontSize: 16, width: 60, borderRadius: 4, border: '1px solid #ddd' }}
              />
            </div>
            
            <button
              onClick={initializePayload}
              style={{ 
                background: '#0066cc', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: 4, 
                fontSize: 16, 
                cursor: 'pointer' 
              }}
            >
              Initialize Letter Hunt
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#e8f5e8', padding: 16, borderRadius: 8, marginBottom: 32 }}>
              <h2>Letter Hunt for {payload.childName} - Letter {payload.targetLetter}</h2>
              <p>Generate all required assets below, then submit for video creation.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              {Object.entries(payload.assets).map(([key, asset]) => (
                <div
                  key={key}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                    background: asset.status === 'ready' ? '#f0f8f0' : 
                               asset.status === 'generating' ? '#fff8dc' : '#f9f9f9'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                    {asset.name}
                    <span style={{ 
                      marginLeft: 8, 
                      fontSize: 12, 
                      color: asset.status === 'ready' ? 'green' : 
                             asset.status === 'generating' ? 'orange' : 'red',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {asset.status}
                    </span>
                  </h3>
                  
                  <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>
                    {asset.description}
                  </p>
                  
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    Type: {asset.type}
                  </div>

                  {asset.status === 'ready' && asset.url && (
                    <div style={{ marginBottom: 12 }}>
                      {asset.type === 'image' && (
                        <img 
                          src={asset.url} 
                          alt={asset.name}
                          style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                        />
                      )}
                      {asset.type === 'audio' && (
                        <audio controls style={{ width: '100%' }}>
                          <source src={asset.url} type="audio/mpeg" />
                        </audio>
                      )}
                      {asset.type === 'video' && (
                        <video controls style={{ maxWidth: '100%', height: 'auto' }}>
                          <source src={asset.url} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => generateAsset(key as keyof LetterHuntPayload['assets'])}
                    disabled={asset.status === 'generating'}
                    style={{
                      background: asset.status === 'ready' ? '#28a745' :
                                 asset.status === 'generating' ? '#ffc107' : '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: asset.status === 'generating' ? 'not-allowed' : 'pointer',
                      fontSize: 14
                    }}
                  >
                    {asset.status === 'ready' ? 'Regenerate' :
                     asset.status === 'generating' ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <button
                onClick={submitForVideoGeneration}
                disabled={!canSubmitVideo() || loading}
                style={{
                  background: canSubmitVideo() ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: 8,
                  fontSize: 18,
                  cursor: canSubmitVideo() ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Submitting...' : 
                 canSubmitVideo() ? 'Generate Letter Hunt Video!' : 
                 'Complete All Assets to Generate Video'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
