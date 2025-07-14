import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { getThemeCategories, getSafeZonesForTemplate } from '@/lib/prompt-engine-client';
import AdminHeader from '@/components/AdminHeader';

interface PromptForm {
  childName: string;
  theme: string;
  ageRange: string;
  template: 'lullaby' | 'name-video' | 'name-show' | 'educational' | 'letter-hunt';
  personalization: 'general' | 'personalized';
  safeZones: string[];
  promptCount: number;
  aspectRatio: '16:9' | '9:16';
  artStyle: string;
  customArtStyle: string;
  additionalContext: string;
  assetType?: string; // Keep for backward compatibility
  imageType?: 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingImage' | 'characterImage' | 'sceneImage' | 'bedtime_intro' | 'bedtime_outro' | 'bedtime_scene' | 'letter_image' | 'name_intro' | 'name_outro' | 'letterImageLeftSafe' | 'letterImageRightSafe' | 'introScene' | 'outroScene' | 'nameVideoTitleCard';
  targetLetter?: string; // Add target letter field for Letter Hunt
}

interface GeneratedPrompts {
  [safeZone: string]: {
    images: string[];
    metadata: {
      template: string;
      safeZone: string;
      theme: string;
      ageRange: string;
      aspectRatio: string;
      artStyle: string;
      variations?: string[];
      generatedAt: string;
    };
  };
}

export default function PromptGeneratorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<PromptForm>({
    childName: '',
    theme: '',
    ageRange: '2-4',
    template: 'name-video',
    personalization: 'general',
    safeZones: ['center_safe'],
    promptCount: 3,
    aspectRatio: '16:9',
    artStyle: '2D Pixar Style',
    customArtStyle: '',
    additionalContext: '',
    assetType: undefined,
    imageType: undefined,
    targetLetter: undefined
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showThemeHelper, setShowThemeHelper] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  // Handle URL parameters for pre-filling form (e.g., from Letter Hunt page)
  useEffect(() => {
    if (router.isReady) {
      const { query } = router;
      
      if (query.templateType === 'letter-hunt') {
        // For Letter Hunt, determine proper safe zone based on image type
        const imageType = (query.assetType as string) || 'titleCard';
        let safeZone = 'center_safe'; // Default safe zone
        
        // Title cards can use all_ok since they're designed for full composition
        if (imageType === 'titleCard') {
          safeZone = 'all_ok';
        }
        // Other image types might need different safe zones based on their requirements
        else if (imageType === 'signImage' || imageType === 'bookImage' || imageType === 'groceryImage') {
          safeZone = 'all_ok'; // Letter-specific images can use full composition for better visual impact
        }
        else if (imageType === 'endingImage') {
          safeZone = 'all_ok'; // Celebratory ending can use full composition
        }
        
        setForm(prev => ({
          ...prev,
          template: 'letter-hunt',
          childName: (query.childName as string) || '',
          theme: (query.theme as string) || '', // Don't default to 'monsters' - use empty string
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: [safeZone],
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: (query.personalization as 'general' | 'personalized') || 'general', // Use passed personalization
          additionalContext: '', // Keep additionalContext empty for letter hunt - target letter will be passed separately
          imageType: imageType as any, // Use the new imageType field
          assetType: imageType, // Keep for backward compatibility
          targetLetter: (query.letterFocus as string) || (query.targetLetter as string) || 'A' // Use letterFocus parameter
        }));
        
        // Store Letter Hunt specific parameters for return
        if (query.returnUrl && query.assetKey) {
          sessionStorage.setItem('letterHuntReturnUrl', query.returnUrl as string);
          sessionStorage.setItem('letterHuntAssetKey', query.assetKey as string);
          sessionStorage.setItem('letterHuntTargetLetter', (query.letterFocus as string) || (query.targetLetter as string) || '');
          sessionStorage.setItem('letterHuntImageType', imageType);
        }
      }
      else if (query.templateType === 'lullaby') {
        // For Lullaby, determine asset class and safe zone based on image type
        const assetClass = (query.assetClass as string) || 'bedtime_intro';
        const safeZone = (query.safeZone as string) || 'slideshow'; // Default to slideshow if not specified
        
        setForm(prev => ({
          ...prev,
          template: 'lullaby',
          childName: (query.childName as string) || '',
          theme: (query.childTheme as string) || '',
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: [safeZone], // Use the safe zone passed from Lullaby request v2
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: (query.personalization as 'general' | 'personalized') || 'personalized',
          additionalContext: '', // Keep empty - we'll build context based on asset class
          imageType: assetClass as any // Map assetClass to imageType for consistency
        }));
      }
      else if (query.templateType === 'name-video') {
        // For Name Video, determine asset class and safe zone based on image type
        const assetClass = (query.assetClass as string) || 'letter_image';
        const safeZone = (query.safeZone as string) || 'left_safe'; // Default to left_safe if not specified
        
        setForm(prev => ({
          ...prev,
          template: 'name-video',
          childName: (query.childName as string) || '',
          theme: (query.childTheme as string) || '',
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: [safeZone], // Use the safe zone passed from Name Video request v2
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: (query.personalization as 'general' | 'personalized') || 'personalized',
          additionalContext: '', // Keep empty - we'll build context based on asset class
          imageType: assetClass as any, // Map assetClass to imageType for consistency
          targetLetter: (query.letter as string) || '' // For letter images
        }));
      }
    }
  }, [router.isReady, router.query]);

  // Update safe zones when imageType changes (like LetterHunt does)
  useEffect(() => {
    if (form.template === 'letter-hunt' && form.imageType) {
      let safeZone = 'center_safe'; // Default safe zone
      
      // Title cards can use all_ok since they're designed for full composition
      if (form.imageType === 'titleCard') {
        safeZone = 'all_ok';
      }
      // Other image types might need different safe zones based on their requirements
      else if (form.imageType === 'signImage' || form.imageType === 'bookImage' || form.imageType === 'groceryImage') {
        safeZone = 'all_ok'; // Letter-specific images can use full composition for better visual impact
      }
      else if (form.imageType === 'endingImage') {
        safeZone = 'all_ok'; // Celebratory ending can use full composition
      }
      
      setForm(prev => ({
        ...prev,
        safeZones: [safeZone]
      }));
    } else if (form.template === 'lullaby' && form.imageType) {
      let safeZone = 'slideshow'; // Default safe zone for lullaby
      
      // Set appropriate safe zone based on Lullaby image type
      if (form.imageType === 'bedtime_intro') {
        safeZone = 'frame'; // Frame composition with center area empty for title text
      } else if (form.imageType === 'bedtime_outro') {
        safeZone = 'outro_safe'; // Closing frame with decorative border
      } else if (form.imageType === 'bedtime_scene') {
        safeZone = 'slideshow'; // Full frame content for slideshow presentation
      }
      
      setForm(prev => ({
        ...prev,
        safeZones: [safeZone]
      }));
    } else if (form.template === 'name-video' && form.imageType) {
      let safeZone = 'center_safe'; // Default safe zone for name-video
      
      // Set appropriate safe zone based on name-video image type - auto-applied
      if (form.imageType === 'letterImageLeftSafe') {
        safeZone = 'left_safe'; // Character on right, text safe on left
      } else if (form.imageType === 'letterImageRightSafe') {
        safeZone = 'right_safe'; // Character on left, text safe on right
      } else if (form.imageType === 'introScene') {
        safeZone = 'frame'; // Frame safe zone for intro
      } else if (form.imageType === 'outroScene') {
        safeZone = 'frame'; // Frame safe zone for outro
      } else if (form.imageType === 'nameVideoTitleCard') {
        safeZone = 'all_ok'; // No safe zone restrictions for title card
      }
      
      setForm(prev => ({
        ...prev,
        safeZones: [safeZone]
      }));
    }
  }, [form.template, form.imageType]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate name for name-show templates and letter-hunt templates with personalized content
    if ((form.template === 'name-show' || (form.template === 'letter-hunt' && form.personalization === 'personalized')) && !form.childName.trim()) {
      setError(`Child's name is required for ${form.template === 'name-show' ? 'Name Show' : 'Letter Hunt'} template`);
      setLoading(false);
      return;
    }

    // Validate asset type selection for templates that require it
    if ((form.template === 'name-video' || form.template === 'letter-hunt' || form.template === 'lullaby') && !form.imageType) {
      const templateName = form.template === 'name-video' ? 'Name Video' : 
                          form.template === 'letter-hunt' ? 'Letter Hunt' : 'Lullaby';
      setError(`Asset type selection is required for ${templateName} template`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          targetLetter: form.targetLetter // Make sure targetLetter is included
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedPrompts(result.prompts);
        
        if (result.isStandalone) {
          setSuccess(`Prompts generated and saved to database! Project ID: ${result.projectId}`);
        } else {
          setSuccess('Prompts generated successfully!');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate prompts');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (template: 'lullaby' | 'name-video' | 'name-show' | 'educational' | 'letter-hunt') => {
    setForm(prev => ({
      ...prev,
      template,
      safeZones: template === 'lullaby' ? ['slideshow'] : 
                 template === 'letter-hunt' ? ['all_ok'] : ['center_safe'],
      // Only automatically set personalization for name-show templates, not letter-hunt
      personalization: template === 'name-show' ? 'personalized' : prev.personalization
    }));
  };

  const getSafeZoneOptions = () => {
    if (form.template === 'lullaby') {
      return [
        { value: 'slideshow', label: 'Slideshow (Full Frame)' },
        { value: 'frame', label: 'Frame (Edges Only)' }
      ];
    } else {
      return [
        { value: 'left_safe', label: 'Left Safe (Right Side Character)' },
        { value: 'right_safe', label: 'Right Safe (Left Side Character)' },
        { value: 'center_safe', label: 'Center Safe (Bottom Character)' },
        { value: 'intro_safe', label: 'Intro Safe (Opening Sequence)' },
        { value: 'outro_safe', label: 'Outro Safe (Closing Sequence)' },
        { value: 'all_ok', label: 'All OK (No Restrictions)' },
        { value: 'not_applicable', label: 'Not Applicable' }
      ];
    }
  };

  // Generate image for Letter Hunt and return to Letter Hunt page
  const generateImageForLetterHunt = async (prompt: string) => {
    const returnUrl = sessionStorage.getItem('letterHuntReturnUrl');
    const assetKey = sessionStorage.getItem('letterHuntAssetKey');
    
    if (!returnUrl || !assetKey) {
      alert('Missing Letter Hunt return information. Please try again from the Letter Hunt page.');
      return;
    }

    try {
      setLoading(true);
      
      // Call the image generation API
      const response = await fetch('/api/assets/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: 'letter-hunt',
          safeZone: form.safeZones[0] || 'center_safe',
          theme: form.theme,
          childName: form.childName,
          targetLetter: sessionStorage.getItem('letterHuntTargetLetter'),
          imageType: sessionStorage.getItem('letterHuntImageType'),
          assetType: sessionStorage.getItem('letterHuntImageType'), // Keep for backward compatibility
          artStyle: form.artStyle,
          ageRange: form.ageRange,
          aspectRatio: form.aspectRatio,
          customPrompt: prompt // Use the selected prompt
        })
      });

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        // For Letter Hunt, submit the image directly instead of redirecting
        if (returnUrl && assetKey) {
          try {
            // Submit the generated image to update the Letter Hunt asset
            const submitResponse = await fetch('/api/letter-hunt/update-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assetKey: assetKey,
                imageUrl: data.imageUrl,
                imageType: sessionStorage.getItem('letterHuntImageType'),
                assetType: sessionStorage.getItem('letterHuntImageType'), // Keep for backward compatibility
                childName: form.childName,
                targetLetter: form.targetLetter || sessionStorage.getItem('letterHuntTargetLetter')
              })
            });

            const submitData = await submitResponse.json();
            
            if (submitData.success) {
              setSuccess(`✅ Image generated and submitted successfully! You can generate more images or return to Letter Hunt.`);
            } else {
              throw new Error(submitData.error || 'Failed to submit image to Letter Hunt');
            }
          } catch (submitError) {
            console.error('Error submitting to Letter Hunt:', submitError);
            setError(`Image generated successfully, but failed to submit to Letter Hunt: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`);
          }
        } else {
          // Regular success for non-Letter Hunt workflows
          setSuccess(`Image generated successfully! URL: ${data.imageUrl}`);
        }
        
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image for Letter Hunt:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to image generator with context
  const navigateToImageGenerator = (prompt: string, metadata: any, safeZone: string) => {
    const params = new URLSearchParams({
      prompt: prompt,
      template: metadata.template,
      theme: metadata.theme,
      ageRange: metadata.ageRange,
      aspectRatio: metadata.aspectRatio || '16:9',
      artStyle: metadata.artStyle || '2D Pixar Style',
      safeZone: safeZone,
      childName: form.childName || '',
      ...(metadata.imageType && { imageType: metadata.imageType }),
      ...(form.additionalContext && { additionalContext: form.additionalContext }),
      ...(form.targetLetter && { targetLetter: form.targetLetter }),
      ...(sessionStorage.getItem('letterHuntTargetLetter') && { targetLetter: sessionStorage.getItem('letterHuntTargetLetter')! })
    });

    router.push(`/admin/ai-generator?${params.toString()}`);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="AI Prompt Generator"
        subtitle="Generate high-quality prompts for AI content creation"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Improvement Notice */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="text-green-400 text-xl">🎉</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Prompt Generation Enhanced!</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>More Variety:</strong> "Dogs" now generates different breeds (Golden Retriever, Beagle, Pug, etc.)</li>
                  <li><strong>Fixed Safe Zones:</strong> No more "40% safe" text appearing in images</li>
                  <li><strong>New Templates:</strong> Added Educational template, ready for 8-10+ more</li>
                  <li><strong>Smart Filtering:</strong> Age-appropriate content automatically selected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Generate High-Quality Prompts</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('name-video')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'name-video'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Name Video</div>
                    <div className="text-sm text-gray-600">Educational content with single characters</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('name-show')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'name-show'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Name Show</div>
                    <div className="text-sm text-gray-600">Game show-style title cards with text</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('lullaby')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'lullaby'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Lullaby</div>
                    <div className="text-sm text-gray-600">Calming bedtime content</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('educational')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'educational'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Educational</div>
                    <div className="text-sm text-gray-600">Learning-focused content</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('letter-hunt')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'letter-hunt'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Letter Hunt</div>
                    <div className="text-sm text-gray-600">Interactive letter finding adventures</div>
                  </button>
                </div>
              </div>

              {/* Image Type Selector for Letter Hunt */}
              {form.template === 'letter-hunt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'titleCard', label: 'Title Card', desc: 'Letter Hunt for [NAME]' },
                      { value: 'signImage', label: 'Sign Image', desc: 'Letter on street signs' },
                      { value: 'bookImage', label: 'Book Image', desc: 'Letter on book covers' },
                      { value: 'groceryImage', label: 'Grocery Image', desc: 'Letter on products' },
                      { value: 'endingImage', label: 'Ending Image', desc: 'Celebratory finale' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, imageType: value as any }))}
                        className={`p-3 border rounded-lg text-left text-sm ${
                          form.imageType === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-gray-600">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.template === 'lullaby' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'bedtime_intro', label: 'Intro Scene', desc: 'Peaceful nighttime intro' },
                      { value: 'bedtime_outro', label: 'Outro Scene', desc: 'Serene goodnight scene' },
                      { value: 'bedtime_scene', label: 'Slideshow Scene', desc: 'Soothing bedtime imagery' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, imageType: value as any }))}
                        className={`p-3 border rounded-lg text-left text-sm ${
                          form.imageType === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-gray-600">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.template === 'name-video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type *
                  </label>
                  {!form.imageType && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-700">
                        <strong>Choose an asset type:</strong> Each asset type automatically applies the correct safe zone and generates specialized prompts.
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'letterImageLeftSafe', label: 'Letter Left Safe', desc: 'Character on right, text safe on left' },
                      { value: 'letterImageRightSafe', label: 'Letter Right Safe', desc: 'Character on left, text safe on right' },
                      { value: 'introScene', label: 'Intro Scene', desc: 'Opening frame/border' },
                      { value: 'outroScene', label: 'Outro Scene', desc: 'Closing frame/border' },
                      { value: 'nameVideoTitleCard', label: 'Title Card', desc: 'Child name prominently displayed' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, imageType: value as any }))}
                        className={`p-3 border rounded-lg text-left text-sm ${
                          form.imageType === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-gray-600">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme {form.template === 'letter-hunt' && form.personalization === 'general' ? '' : '*'}
                </label>
                <input
                  type="text"
                  value={form.theme}
                  onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={form.template === 'letter-hunt' && form.personalization === 'general' 
                    ? "Optional for letter-specific images (leave empty)" 
                    : "e.g., Space Adventure, Ocean Friends, Forest Animals"}
                  required={!(form.template === 'letter-hunt' && form.personalization === 'general')}
                />
                {form.template === 'letter-hunt' && form.personalization === 'general' ? (
                  <div className="mt-2 text-xs text-green-600">
                    🎯 <strong>Letter Hunt (General):</strong> Theme is optional for letter-specific images (signs, books, grocery). 
                    These images focus on displaying the letter clearly and are reusable across different themes.
                  </div>
                ) : (
                  <>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Popular themes with variety:</strong> dogs, cats, space, ocean, farm, forest, dinosaurs, vehicles, princesses, superheroes
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      💡 <strong>Tip:</strong> Our new system automatically creates variety - "dogs" will generate different breeds like Golden Retriever, Beagle, Pug, etc.
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowThemeHelper(!showThemeHelper)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {showThemeHelper ? 'Hide' : 'Show'} Theme Explorer
                </button>
                
                {showThemeHelper && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Available Theme Categories:</h4>
                    {Object.entries(getThemeCategories()).map(([category, themes]) => (
                      <div key={category} className="mb-2">
                        <span className="text-xs font-medium text-blue-800 capitalize">{category}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(themes as string[]).map((theme: string) => (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, theme }))}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Child's Name for Name Show Template */}
              {form.template === 'name-show' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name for "THE [NAME] SHOW" *
                  </label>
                  <input
                    type="text"
                    value={form.childName}
                    onChange={(e) => setForm(prev => ({ ...prev, childName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's name (e.g., Emma, Alex, Sam)"
                    required
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    💡 This will appear as "THE [NAME] SHOW" in large, bold letters on the title card
                  </div>
                </div>
              )}

              {/* Letter Hunt Template Fields */}
              {form.template === 'letter-hunt' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Letter *
                    </label>
                    <select
                      value={form.targetLetter || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, targetLetter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a letter...</option>
                      {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                        <option key={letter} value={letter}>{letter}</option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-gray-600">
                      🎯 The letter that will be prominently featured in the image
                    </div>
                  </div>
                  
                  {form.personalization === 'personalized' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Child's Name *
                      </label>
                      <input
                        type="text"
                        value={form.childName}
                        onChange={(e) => setForm(prev => ({ ...prev, childName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter child's name (e.g., Emma, Alex, Sam)"
                        required
                      />
                      <div className="mt-2 text-xs text-gray-600">
                        💡 For title cards: Will appear as "[NAME]'s Letter Hunt!" For general images: Not included in image
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Age Range *
                </label>
                <select
                  value={form.ageRange}
                  onChange={(e) => setForm(prev => ({ ...prev, ageRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2-4">2-4 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="4-6">4-6 years</option>
                  <option value="5-7">5-7 years</option>
                </select>
              </div>

              {/* Personalization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personalization
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="general"
                      checked={form.personalization === 'general'}
                      onChange={(e) => setForm(prev => ({ ...prev, personalization: e.target.value as 'general' | 'personalized' }))}
                      className="mr-2"
                    />
                    General Content
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="personalized"
                      checked={form.personalization === 'personalized'}
                      onChange={(e) => setForm(prev => ({ ...prev, personalization: e.target.value as 'general' | 'personalized' }))}
                      className="mr-2"
                    />
                    Personalized Content
                  </label>
                </div>
              </div>

              {/* Child Name (if personalized) */}
              {form.personalization === 'personalized' && form.template !== 'name-show' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    value={form.childName}
                    onChange={(e) => setForm(prev => ({ ...prev, childName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's name"
                  />
                </div>
              )}

              {/* Safe Zone Selection - only show for name-video, name-show, educational */}
              {!['letter-hunt', 'lullaby'].includes(form.template) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zones</label>
                  <div className="text-xs text-gray-600 mb-2">
                    Compatible zones for {form.template}: {getSafeZonesForTemplate(form.template).join(', ')}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {getSafeZonesForTemplate(form.template).map((zone: string) => (
                      <label key={zone} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.safeZones.includes(zone)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(prev => ({ ...prev, safeZones: [...prev.safeZones, zone] }));
                            } else {
                              setForm(prev => ({ ...prev, safeZones: prev.safeZones.filter(z => z !== zone) }));
                            }
                          }}
                        />
                        <span className="text-sm capitalize">{zone.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe Zone Display for Letter Hunt, Lullaby, and Name Video - show current safe zone but no checkboxes */}
              {['letter-hunt', 'lullaby', 'name-video'].includes(form.template) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zones</label>
                  {form.template === 'letter-hunt' && form.imageType ? (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Recommended for {form.imageType}:</span>{' '}
                      {form.safeZones[0]} ({form.safeZones[0] === 'all_ok' ? 'full composition' : 'centered content'})
                    </div>
                  ) : form.template === 'lullaby' && form.imageType ? (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Auto-assigned for {form.imageType === 'bedtime_intro' ? 'Intro Scene' : form.imageType === 'bedtime_outro' ? 'Outro Scene' : 'Slideshow Scene'}:</span>{' '}
                      {form.safeZones[0]} ({form.safeZones[0] === 'frame' ? 'decorative frame with empty center' : form.safeZones[0] === 'outro_safe' ? 'closing frame with border' : 'full frame content'})
                    </div>
                  ) : form.template === 'name-video' && form.imageType ? (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Auto-assigned for {form.imageType === 'letterImageLeftSafe' ? 'Letter Left Safe' : form.imageType === 'letterImageRightSafe' ? 'Letter Right Safe' : form.imageType === 'introScene' ? 'Intro Scene' : form.imageType === 'outroScene' ? 'Outro Scene' : 'Title Card'}:</span>{' '}
                      {form.safeZones[0]} ({form.safeZones[0] === 'left_safe' ? 'character on right, left clear for text' : form.safeZones[0] === 'right_safe' ? 'character on left, right clear for text' : form.safeZones[0] === 'frame' ? 'decorative frame with empty center' : form.safeZones[0] === 'all_ok' ? 'full composition' : 'centered layout'})
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mb-2">
                      Current: {form.safeZones[0] || 'none selected'} (auto-assigned based on image type)
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Prompts per Safe Zone</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.promptCount}
                  onChange={e => setForm(prev => ({ ...prev, promptCount: Math.max(1, Math.min(10, Number(e.target.value))) }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={form.aspectRatio === '16:9'}
                      onChange={() => setForm(prev => ({ ...prev, aspectRatio: '16:9' }))}
                    />
                    <span>16:9 (Landscape)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={form.aspectRatio === '9:16'}
                      onChange={() => setForm(prev => ({ ...prev, aspectRatio: '9:16' }))}
                    />
                    <span>9:16 (Portrait)</span>
                  </label>
                </div>
              </div>

              {/* Art Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Art Style</label>
                <select
                  value={form.artStyle}
                  onChange={(e) => setForm(prev => ({ ...prev, artStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2D Pixar Style">2D Pixar Style</option>
                  <option value="Watercolor">Watercolor</option>
                  <option value="Crayon Drawing">Crayon Drawing</option>
                  <option value="Storybook Illustration">Storybook Illustration</option>
                  <option value="Clay Animation">Clay Animation</option>
                  <option value="Paper Cutout">Paper Cutout</option>
                  <option value="Digital Cartoon">Digital Cartoon</option>
                  <option value="Felt Art">Felt Art</option>
                  <option value="Wooden Toy Style">Wooden Toy Style</option>
                  <option value="Finger Painting">Finger Painting</option>
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {/* Custom Art Style (if Other is selected) */}
              {form.artStyle === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Art Style</label>
                  <input
                    type="text"
                    value={form.customArtStyle}
                    onChange={(e) => setForm(prev => ({ ...prev, customArtStyle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your custom art style..."
                    required
                  />
                </div>
              )}

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context
                </label>
                <textarea
                  value={form.additionalContext}
                  onChange={(e) => setForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional details or preferences..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!form.theme && !(form.template === 'letter-hunt' && form.personalization === 'general'))}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Prompts...' : 'Generate Prompts'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Generated Prompts</h2>
            
            {generatedPrompts ? (
              <div className="space-y-6">
                {Object.entries(generatedPrompts).map(([safeZone, prompts]) => (
                  <div key={safeZone} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4 capitalize">
                      {safeZone.replace('_', ' ')} Zone
                    </h3>
                    
                    {/* Images */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Image Prompts ({prompts.images.length})</h4>
                      <div className="space-y-2">
                        {prompts.images.map((prompt, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-medium text-gray-700 mb-1">Image {index + 1}:</div>
                            <div className="text-gray-600 mb-2">{prompt}</div>
                            <div className="flex gap-2 mt-2">
                              {/* Letter Hunt integration button */}
                              {form.template === 'letter-hunt' && (
                                <button
                                  onClick={() => generateImageForLetterHunt(prompt)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Generate Image & Submit to Letter Hunt
                                </button>
                              )}
                              {/* General image generator button */}
                              <button
                                onClick={() => navigateToImageGenerator(prompt, prompts.metadata, safeZone)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Open in Image Generator
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Generation Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Template:</span> {prompts.metadata.template}
                        </div>
                        <div>
                          <span className="font-medium">Safe Zone:</span> {prompts.metadata.safeZone}
                        </div>
                        {form.template === 'letter-hunt' && form.imageType && (
                          <div>
                            <span className="font-medium">Image Type:</span> {form.imageType}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Theme:</span> {prompts.metadata.theme}
                        </div>
                        <div>
                          <span className="font-medium">Age Range:</span> {prompts.metadata.ageRange}
                        </div>
                        <div>
                          <span className="font-medium">Aspect Ratio:</span> {prompts.metadata.aspectRatio}
                        </div>
                        <div>
                          <span className="font-medium">Art Style:</span> {prompts.metadata.artStyle || '2D Pixar Style'}
                        </div>
                      </div>
                      {prompts.metadata.variations && prompts.metadata.variations.length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-green-700">🎯 Variations Used:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {prompts.metadata.variations.map((variation, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {variation}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Generate prompts to see results here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}