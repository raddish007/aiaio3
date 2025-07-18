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
    
    // Parse ElevenLabs specific errors
    let errorMessage = 'Failed to generate audio';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error && error.message.includes('ElevenLabs API error: 429')) {
      errorMessage = 'ElevenLabs API rate limit or system busy';
      errorDetails = 'The system is experiencing heavy traffic. Please try again in a few minutes. Higher subscriptions have priority.';
    } else if (error instanceof Error && error.message.includes('ElevenLabs API error')) {
      errorMessage = 'ElevenLabs API error';
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateBackgroundMusic(storyVariables: any): Promise<{ jobId: string; status: string }> {
  // For wish-button template, always use the existing approved background music
  const WISH_BUTTON_BG_MUSIC_ID = 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9';
  
  console.log('🎵 Using existing approved background music for wish-button:', WISH_BUTTON_BG_MUSIC_ID);
  
  // Get the existing background music asset
  const { data: existingAsset, error: assetError } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('id', WISH_BUTTON_BG_MUSIC_ID)
    .single();

  if (assetError || !existingAsset) {
    console.error('❌ Failed to find existing background music asset:', assetError);
    throw new Error(`Background music asset ${WISH_BUTTON_BG_MUSIC_ID} not found`);
  }

  console.log('✅ Found existing background music asset:', existingAsset.title || 'Wish Button Background Music');

  // Create a job ID for tracking (even though we're using existing asset)
  const jobId = `existing_bg_music_${Date.now()}`;

  return {
    jobId,
    status: 'completed' // Already exists and is approved
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
