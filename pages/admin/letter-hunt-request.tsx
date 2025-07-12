import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import MissingVideoTracker from '../../components/MissingVideoTracker';

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
    // Auto-populate target letter as first letter of child's name
    const firstLetter = child.name.charAt(0).toUpperCase();
    setTargetLetter(firstLetter);
    
    console.log(`🎯 Auto-selected letter "${firstLetter}" for ${child.name}`);
  };

  const handleManualNameInput = (name: string) => {
    setChildName(name);
    // Auto-populate target letter as first letter of manually typed name
    if (name.length > 0) {
      const firstLetter = name.charAt(0).toUpperCase();
      setTargetLetter(firstLetter);
      console.log(`🎯 Auto-populated letter "${firstLetter}" for manually typed name "${name}"`);
    } else {
      setTargetLetter('');
    }
  };

  const initializePayload = async () => {
    const nameToUse = selectedChild?.name || childName;
    const themeToUse = selectedChild?.primary_interest || 'adventure';
    
    if (!nameToUse || !targetLetter) {
      alert('Please enter both child name and target letter');
      return;
    }

    console.log(`🔍 Checking for existing Letter Hunt assets for ${nameToUse} (Letter ${targetLetter})`);

    // Check for existing approved Letter Hunt assets for this child and letter
    const { data: existingAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', nameToUse)
      .eq('metadata->>targetLetter', targetLetter);

    if (error) {
      console.error('Error checking for existing assets:', error);
    }

    console.log(`📦 Found ${existingAssets?.length || 0} existing Letter Hunt assets:`, existingAssets);

    // Create mapping of existing assets by imageType
    const existingByType = new Map();
    existingAssets?.forEach(asset => {
      const imageType = asset.metadata?.imageType;
      if (imageType) {
        existingByType.set(imageType, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at
        });
      }
    });

    const newPayload: LetterHuntPayload = {
      childName: nameToUse.trim(),
      targetLetter: targetLetter.toUpperCase().trim(),
      assets: {
        // Images
        titleCard: existingByType.get('titleCard') ? {
          ...existingByType.get('titleCard'),
          type: 'image',
          name: 'Title Card',
          description: `"${nameToUse}'s Letter Hunt!" title card with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Title Card',
          description: `"${nameToUse}'s Letter Hunt!" title card with ${themeToUse} theme`,
          status: 'missing'
        },
        signImage: existingByType.get('signImage') ? {
          ...existingByType.get('signImage'),
          type: 'image',
          name: 'Letter on Signs',
          description: `Letter ${targetLetter} on colorful street sign with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter on Signs',
          description: `Letter ${targetLetter} on colorful street sign with ${themeToUse} theme`,
          status: 'missing'
        },
        bookImage: existingByType.get('bookImage') ? {
          ...existingByType.get('bookImage'),
          type: 'image',
          name: 'Letter on Books',
          description: `Letter ${targetLetter} on children's book cover with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter on Books',
          description: `Letter ${targetLetter} on children's book cover with ${themeToUse} theme`,
          status: 'missing'
        },
        groceryImage: existingByType.get('groceryImage') ? {
          ...existingByType.get('groceryImage'),
          type: 'image',
          name: 'Letter in Grocery Store',
          description: `Letter ${targetLetter} on grocery store sign/cereal box with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter in Grocery Store',
          description: `Letter ${targetLetter} on grocery store sign/cereal box with ${themeToUse} theme`,
          status: 'missing'
        },
        endingImage: existingByType.get('endingImage') ? {
          ...existingByType.get('endingImage'),
          type: 'image',
          name: 'Ending Image',
          description: `Letter ${targetLetter} with ${themeToUse} characters waving goodbye`
        } : {
          type: 'image',
          name: 'Ending Image',
          description: `Letter ${targetLetter} with ${themeToUse} characters waving goodbye`,
          status: 'missing'
        },
        // Videos
        introVideo: {
          type: 'video',
          name: 'Intro Video',
          description: `${themeToUse} character pointing to giant letter`,
          status: 'missing'
        },
        intro2Video: {
          type: 'video',
          name: 'Search Video',
          description: `${themeToUse} character searching around playfully`,
          status: 'missing'
        },
        happyDanceVideo: {
          type: 'video',
          name: 'Happy Dance Video',
          description: `${themeToUse} character doing a joyful dance`,
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

    // Log findings
    const foundAssets = Array.from(existingByType.keys());
    if (foundAssets.length > 0) {
      console.log(`✅ Found existing assets: ${foundAssets.join(', ')}`);
    } else {
      console.log('📭 No existing assets found for this child/letter combination');
    }

    setPayload(newPayload);
  };

  const generateAsset = async (assetKey: keyof LetterHuntPayload['assets']) => {
    if (!payload) {
      console.error('No payload available for asset generation');
      return;
    }

    const asset = payload.assets[assetKey];
    console.log(`🎯 Generating asset: ${assetKey}`, { asset, payload });

    try {
      // For now, we'll start with generating the title card image
      if (asset.type === 'image' && assetKey === 'titleCard') {
        // Instead of calling API directly, redirect to manual prompt creation flow
        const promptParams = new URLSearchParams({
          templateType: 'letter-hunt',
          theme: selectedChild?.primary_interest || 'general',
          childName: payload.childName,
          targetLetter: payload.targetLetter,
          assetType: 'titleCard', // This will be mapped to imageType in the prompt generator
          artStyle: '2D Pixar Style',
          ageRange: '3-5',
          aspectRatio: '16:9',
          returnUrl: window.location.href, // Return to this page after prompt creation
          assetKey: assetKey // So we know which asset to update when returning
        });
        
        console.log(`🎨 Redirecting to manual prompt creation for ${asset.name}...`);
        console.log('📋 Prompt params:', promptParams.toString());
        
        await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
        return; // Don't update status since we're redirecting
      } else {
        // Update status to generating for other asset types
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            [assetKey]: { ...asset, status: 'generating' }
          }
        } : null);
        
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
      console.error('Error details:', {
        assetKey,
        asset,
        payload,
        selectedChild,
        error: error instanceof Error ? error.message : error
      });
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
    // For now, only require Title Card to be ready for testing
    return payload.assets.titleCard.status === 'ready';
    // TODO: Later enable all assets: return Object.values(payload.assets).every(asset => asset.status === 'ready');
  };

  const submitForVideoGeneration = async () => {
    if (!payload || !canSubmitVideo()) return;

    setLoading(true);
    try {
      console.log('🎬 Submitting Letter Hunt video generation:', payload);
      
      // Call our new Letter Hunt generation API
      const response = await fetch('/api/videos/generate-letter-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: payload.childName,
          targetLetter: payload.targetLetter,
          childTheme: selectedChild?.primary_interest || 'adventure',
          childAge: selectedChild?.age || 3,
          childId: selectedChild?.id || 'placeholder-child-id',
          submitted_by: 'current-user-id', // This should come from user session
          assets: payload.assets
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Letter Hunt video generation started successfully! 
        
🎬 Render ID: ${data.render_id}
📹 Output URL: ${data.output_url}
⏱️ Duration: ${data.duration_seconds} seconds
📦 Assets Ready: ${data.asset_summary.ready_assets}/${data.asset_summary.total_assets} (${data.asset_summary.completion_percentage}%)

Your video will be available for review in the admin dashboard once complete.`);
        
        // If this was called from an assignment, mark it as completed
        if (router.query.assignment_id) {
          try {
            const assignmentResponse = await fetch('/api/admin/manage-assignments', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assignment_id: router.query.assignment_id,
                status: 'completed',
                output_video_url: data.output_url,
                updated_by: 'current-user-id'
              })
            });

            if (assignmentResponse.ok) {
              console.log('✅ Assignment marked as completed');
            }
          } catch (assignmentError) {
            console.error('Error updating assignment:', assignmentError);
            // Don't fail the whole operation if assignment update fails
          }
        }

        // Redirect to admin dashboard or video status page
        router.push(`/admin/video-status-dashboard?highlight=${data.job_id}`);
        
      } else {
        throw new Error(data.error || 'Failed to start video generation');
      }
      
    } catch (error) {
      console.error('Error submitting video:', error);
      alert(`❌ Failed to submit video generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle returning from prompt creation with generated asset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const generatedImageUrl = urlParams.get('generatedImageUrl');
    const assetKey = urlParams.get('assetKey');
    
    if (generatedImageUrl && assetKey && payload) {
      console.log(`🎨 Received generated image for ${assetKey}:`, generatedImageUrl);
      
      // Update the asset status to ready with the generated image URL
      setPayload(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          [assetKey]: {
            ...prev.assets[assetKey as keyof typeof prev.assets],
            status: 'ready',
            url: generatedImageUrl,
            generatedAt: new Date().toISOString()
          }
        }
      } : null);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname + (window.location.search.replace(/[?&](generatedImageUrl|assetKey)=[^&]*/g, '').replace(/^&/, '?') || '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [payload, router.query]);

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
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Age {selectedChild.age}, loves {selectedChild.primary_interest}
                </div>
                <div style={{ fontSize: 14, color: '#2e7d32', fontWeight: 'bold' }}>
                  🎨 Theme: {selectedChild.primary_interest} (based on child's interests)
                </div>
                <button
                  onClick={() => {
                    setSelectedChild(null);
                    setChildName('');
                    setTargetLetter('');
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
                onChange={(e) => handleManualNameInput(e.target.value)}
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
                {childName && (
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 'normal', 
                    color: '#666',
                    marginLeft: 8
                  }}>
                    (auto-populated from first letter of name)
                  </span>
                )}
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Video Theme:
              </label>
              <div style={{ 
                padding: 8, 
                fontSize: 16, 
                backgroundColor: '#f0f8ff', 
                border: '1px solid #0066cc', 
                borderRadius: 4,
                color: '#0066cc',
                fontWeight: 'bold'
              }}>
                🎨 {selectedChild ? selectedChild.primary_interest : 'Auto-generated'} Theme
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 'normal', 
                  color: '#666',
                  marginLeft: 8
                }}>
                  {selectedChild ? '(based on child\'s interests)' : '(based on child\'s interests when selected)'}
                </span>
              </div>
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
            <div style={{ background: '#e8f5e8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <h2>Letter Hunt for {payload.childName} - Letter {payload.targetLetter}</h2>
              <p>Generate all required assets below, then submit for video creation.</p>
            </div>

            {/* Test Mode Notice */}
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 32 
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>
                🧪 Test Mode: Title Card Only
              </h3>
              <p style={{ margin: 0, color: '#856404' }}>
                Currently only Title Card generation is required for video creation. 
                Other assets are shown for interface testing but not required.
              </p>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      generateAsset(key as keyof LetterHuntPayload['assets']);
                    }}
                    disabled={asset.status === 'generating'}
                    type="button"
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
                 'Generate Title Card to Enable Video Generation (Test Mode)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
