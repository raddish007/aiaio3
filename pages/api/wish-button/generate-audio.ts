import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default voice IDs for children's content
const VOICE_IDS = {
  narrator: 'pNInz6obpgDQGcFmaJgB', // Adam - warm, friendly narrator
  child: 'EXAVITQu4vr4xnSDxMaL', // Bella - child-like voice
  default: 'pNInz6obpgDQGcFmaJgB'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pages, includeBackgroundMusic, storyVariables }: { 
      pages: string[]; 
      includeBackgroundMusic?: boolean;
      storyVariables?: any;
    } = req.body;

    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'Missing required field: pages' });
    }

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        details: 'Please add ELEVENLABS_API_KEY to your environment variables'
      });
    }

    console.log(`🎤 Generating audio for Wish Button story: ${pages.join(', ')}`);
    if (includeBackgroundMusic) {
      console.log('🎵 Including background music generation');
    }

    const generationResults: { [key: string]: { jobId: string; status: string } } = {};

    // Generate audio for each requested page
    for (const page of pages) {
      const result = await generatePageAudio(page);
      generationResults[page] = result;
    }

    // Generate background music if requested
    if (includeBackgroundMusic && storyVariables) {
      const musicResult = await generateBackgroundMusic(storyVariables);
      generationResults['background_music'] = musicResult;
    }

    console.log('✅ Started audio generation jobs for Wish Button story');

    return res.status(200).json({
      success: true,
      generations: generationResults,
      message: `Started audio generation for ${pages.length} page(s)${includeBackgroundMusic ? ' + background music' : ''}`
    });

  } catch (error) {
    console.error('Error generating wish button audio:', error);
    return res.status(500).json({
      error: 'Failed to generate audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateBackgroundMusic(storyVariables: any): Promise<{ jobId: string; status: string }> {
  // Create a music prompt based on story variables
  const musicPrompt = `Create a gentle, magical instrumental background music suitable for a children's storybook. 
  Theme: ${storyVariables.theme}
  Visual Style: ${storyVariables.visualStyle}
  
  The music should be:
  - Soft and whimsical
  - Suitable for children ages 3-8
  - Loopable background music
  - Approximately 2-3 minutes duration
  - Magical and enchanting atmosphere
  - No vocals, instrumental only`;

  const voiceId = VOICE_IDS.narrator; // We'll use text-to-speech for now, but could integrate with music generation APIs
  
  console.log('🎵 Generating background music with prompt:', musicPrompt.substring(0, 100) + '...');

  // For now, we'll generate a simple music description using TTS
  // In production, you might want to integrate with specialized music generation APIs like Mubert, Soundful, or Amper
  const musicDescription = `Gentle magical background music playing softly. This enchanting melody creates a perfect atmosphere for ${storyVariables.childName}'s wish button adventure.`;

  // Generate audio with ElevenLabs (as a placeholder - in production use a music generation service)
  const audioResponse = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY!
    },
    body: JSON.stringify({
      text: musicDescription,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.8,
        similarity_boost: 0.3,
        style: 0.2,
        use_speaker_boost: false
      }
    })
  });

  if (!audioResponse.ok) {
    const errorText = await audioResponse.text();
    throw new Error(`ElevenLabs API error for background music: ${audioResponse.status} - ${errorText}`);
  }

  // Get audio buffer
  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  
  // Create a unique job ID for tracking
  const jobId = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Upload to storage
  const audioUrl = await uploadAudioToStorage(audioBase64, jobId, 'background_music');

  // For background music, we don't have a specific prompt record, so we'll create an asset directly
  // First, let's get the project_id from one of the existing prompts
  const { data: existingPrompts } = await supabaseAdmin
    .from('prompts')
    .select('project_id, theme')
    .eq('metadata->>template', 'wish-button')
    .limit(1);

  if (existingPrompts && existingPrompts.length > 0) {
    const existingPrompt = existingPrompts[0];
    // Create asset record for background music
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert({
        project_id: existingPrompt.project_id,
        type: 'audio',
        title: 'background_music',
        theme: existingPrompt.theme,
        safe_zone: 'not_applicable',
        status: 'pending_review',
        url: audioUrl,
        metadata: {
          template: 'wish-button',
          asset_purpose: 'background_music',
          generation_method: 'elevenlabs_placeholder',
          generation_completed_at: new Date().toISOString(),
          original_prompt: musicPrompt,
          music_description: musicDescription,
          story_theme: storyVariables.theme,
          visual_style: storyVariables.visualStyle,
          style: 'ambient_music',
          prompt_id: null, // No specific prompt for background music
          generation_job_id: jobId
        }
      })
      .select()
      .single();

    if (assetError) {
      console.error('Error creating background music asset record:', assetError);
    }
  }

  return {
    jobId,
    status: 'completed'
  };
}

async function generatePageAudio(page: string): Promise<{ jobId: string; status: string }> {
  // Get the latest audio prompt (script) from database for this page
  const { data: prompts, error: promptError } = await supabaseAdmin
    .from('prompts')
    .select('*')
    .eq('asset_type', 'audio')
    .ilike('metadata->>page', page)
    .eq('metadata->>template', 'wish-button')
    .order('created_at', { ascending: false })
    .limit(1);

  if (promptError) {
    console.error(`❌ Database error looking for audio prompt for ${page}:`, promptError);
    throw new Error(`Database error looking for audio prompt for ${page}: ${promptError.message}`);
  }

  if (!prompts || prompts.length === 0) {
    throw new Error(`No audio prompt found for ${page}. Please generate prompts first.`);
  }

  // Take the most recent prompt
  const prompt = prompts[0];
  
  if (prompts.length > 1) {
    console.log(`⚠️ Found ${prompts.length} audio prompts for ${page}, using most recent (${prompt.id})`);
  }

  const script = prompt.prompt_text;
  const voiceId = VOICE_IDS.narrator; // Use narrator voice for storybook

  console.log(`Starting audio generation for ${page}:`, {
    promptId: prompt.id,
    script: script.substring(0, 100) + '...',
    voiceId
  });

  // Generate audio with ElevenLabs
  const audioResponse = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY!
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });

  if (!audioResponse.ok) {
    const errorText = await audioResponse.text();
    throw new Error(`ElevenLabs API error: ${audioResponse.status} - ${errorText}`);
  }

  // Get audio buffer
  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  
  // Create a unique job ID for tracking
  const jobId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Upload to a temporary storage or process immediately
  const audioUrl = await uploadAudioToStorage(audioBase64, jobId, page);

  // Update prompt status to completed
  await supabaseAdmin
    .from('prompts')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString(),
      metadata: {
        ...prompt.metadata,
        audio_job_id: jobId,
        audio_generated_at: new Date().toISOString()
      }
    })
    .eq('id', prompt.id);

  // Create asset record
  const { data: asset, error: assetError } = await supabaseAdmin
    .from('assets')
    .insert({
      project_id: prompt.project_id,
      type: 'audio',
      title: `${page}_audio`,
      theme: prompt.theme,
      safe_zone: 'not_applicable',
      status: 'pending_review',
      url: audioUrl,
      metadata: {
        template: 'wish-button',
        page: page,
        asset_purpose: `${page}_audio`,
        generation_method: 'elevenlabs',
        voice_id: voiceId,
        generation_completed_at: new Date().toISOString(),
        original_script: script,
        duration_estimate: Math.ceil(script.length / 15), // Rough estimate: ~15 chars per second
        style: 'narrator',
        prompt_id: prompt.id,
        generation_job_id: jobId
      }
    })
    .select()
    .single();

  if (assetError) {
    console.error('Error creating audio asset record:', assetError);
  }

  return {
    jobId,
    status: 'completed'
  };
}

async function uploadAudioToStorage(audioBase64: string, jobId: string, page: string): Promise<string> {
  try {
    // Convert base64 to buffer for upload
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Upload to Supabase storage
    const fileName = `wish-button/${jobId}/${page}_audio.mp3`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('assets')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading audio to storage:', error);
      // Fallback: create a data URL (not recommended for production)
      return `data:audio/mpeg;base64,${audioBase64}`;
    }

    // Get public URL
    const { data: publicData } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(fileName);

    return publicData.publicUrl;

  } catch (error) {
    console.error('Error in uploadAudioToStorage:', error);
    // Fallback: return a data URL
    return `data:audio/mpeg;base64,${audioBase64}`;
  }
}
