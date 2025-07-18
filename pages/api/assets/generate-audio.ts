import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { extractAudioDuration } from '@/lib/asset-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Audio generation request received:', {
    script: req.body.script?.substring(0, 50) + '...',
    voiceId: req.body.voiceId,
    speed: req.body.speed,
  });

  // Debug environment variables
  console.log('Environment variables in Audio API:', {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('ELEVENLABS'))
  });

  try {
    const { script, voiceId, speed, style, projectId, isPersonalized, templateContext } = req.body;

    if (!script || !voiceId) {
      return res.status(400).json({ error: 'Missing required fields: script, voiceId' });
    }

    // Check if ELEVENLABS_API_KEY is configured
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.log('Environment variables check:', {
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT SET'
      });
      return res.status(500).json({ 
        error: 'ELEVENLABS_API_KEY not configured',
        details: 'Please add your ElevenLabs API key to your .env.local file. You can get one from https://elevenlabs.io/'
      });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Check for existing audio asset with same script and template context
    if (templateContext) {
      console.log('🔍 Checking for existing audio asset...');
      const { data: existingAssets, error: checkError } = await supabaseAdmin
        .from('assets')
        .select('*')
        .eq('type', 'audio')
        .eq('metadata->>script', script)
        .eq('metadata->>voice_id', voiceId)
        .eq('metadata->>template_context->template_type', templateContext.templateType)
        .eq('metadata->>template_context->asset_purpose', templateContext.assetPurpose)
        .eq('metadata->>template_context->child_name', templateContext.childName)
        .eq('metadata->>template_context->target_letter', templateContext.targetLetter || '')
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.warn('Error checking for existing assets:', checkError);
        // Continue with generation if check fails
      } else if (existingAssets && existingAssets.length > 0) {
        const existingAsset = existingAssets[0];
        console.log(`✅ Found existing audio asset: ${existingAsset.id}`);
        console.log(`📄 Existing asset details:`, {
          id: existingAsset.id,
          status: existingAsset.status,
          script: existingAsset.metadata?.script,
          created_at: existingAsset.created_at
        });
        
        return res.status(200).json({
          success: true,
          asset: existingAsset,
          reused: true,
          message: 'Reused existing audio asset with identical script and context',
          generationInfo: {
            voiceId: existingAsset.metadata?.voice_id,
            speed: existingAsset.metadata?.speed,
            scriptLength: script.length,
            audioSize: existingAsset.metadata?.audio_size_bytes,
          },
        });
      }
    }

    console.log('🎤 No existing asset found, generating new audio with ElevenLabs...');

    // Generate audio using ElevenLabs API
    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          use_speaker_boost: true,
        },
        output_format: 'mp3_44100_128',
      }),
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('ElevenLabs API error:', audioResponse.status, errorText);
      throw new Error(`ElevenLabs API error: ${audioResponse.status} - ${errorText}`);
    }

    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Extract audio duration using a temporary file
    let audioDuration: number | undefined;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      // Create a temporary file
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);
      
      // Write buffer to temp file
      await fs.promises.writeFile(tempFilePath, audioData);
      
      // Extract duration from temp file
      audioDuration = await extractAudioDuration(tempFilePath);
      console.log(`Audio duration extracted: ${audioDuration?.toFixed(2)} seconds`);
      
      // Clean up temp file
      await fs.promises.unlink(tempFilePath);
    } catch (durationError) {
      console.warn('Failed to extract audio duration:', durationError);
      // Continue without duration - it's not critical for generation
    }

    // Upload audio to Supabase Storage using admin client
    const fileExt = 'mp3';
    const fileName = `elevenlabs_${Date.now()}_${voiceId}.${fileExt}`;
    const filePath = `assets/audio/${fileName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('assets')
      .upload(filePath, audioData, { contentType: 'audio/mpeg', upsert: true });
    if (uploadError) {
      console.error('Error uploading generated audio to storage:', uploadError);
      return res.status(500).json({ error: 'Failed to upload audio to storage', details: uploadError.message });
    }
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(filePath);

    // Create the asset record with file_url and audio_data in metadata
    const assetData = {
      type: 'audio',
      theme: isPersonalized ? `Personalized Audio - ${voiceId}` : `Custom Audio - ${voiceId}`,
      tags: [style, 'elevenlabs', voiceId, isPersonalized ? 'personalized' : null].filter(Boolean),
      status: 'pending',
      project_id: projectId, // Set the actual project_id column
      file_url: publicUrl,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_method: 'elevenlabs',
        voice_id: voiceId,
        speed: speed,
        style: style,
        script_length: script.length,
        project_id: projectId,
        is_personalized: isPersonalized || false,
        audio_size_bytes: audioData.length,
        duration: audioDuration, // Store extracted duration
        script: script, // Store script for regeneration
        // Only include audio_data for letter-hunt and other templates that need it
        // Wish-button uses file_url instead to avoid massive metadata
        ...(templateContext?.templateType !== 'wish-button' ? {
          audio_data: `data:audio/mpeg;base64,${audioData.toString('base64')}` // Store audio in metadata for legacy support
        } : {}),
        // Template-specific metadata (nested format)
        template_context: templateContext ? {
          template_type: templateContext.templateType,
          asset_purpose: templateContext.assetPurpose,
          child_name: templateContext.childName,
          target_letter: templateContext.targetLetter,
          template_specific: true
        } : undefined,
        // Letter Hunt specific metadata (flat format for easy querying)
        ...(templateContext?.templateType === 'letter-hunt' ? {
          template: 'letter-hunt',
          child_name: templateContext.childName,
          targetLetter: templateContext.targetLetter,
          assetPurpose: templateContext.assetPurpose, // Save as assetPurpose for audio assets
          imageType: templateContext.assetPurpose // Also save as imageType for consistency with existing logic
        } : {}),
        // Lullaby and NameVideo specific metadata (flat format for easy querying)
        ...(templateContext?.templateType === 'lullaby' ? {
          template: 'lullaby',
          child_name: templateContext.childName,
          asset_class: templateContext.assetPurpose // Store asset_purpose as asset_class for consistency
        } : {}),
        ...(templateContext?.templateType === 'namevideo' ? {
          template: 'namevideo', 
          child_name: templateContext.childName,
          asset_class: templateContext.assetPurpose // Store asset_purpose as asset_class for consistency
        } : {}),
        // Wish Button specific metadata (flat format for easy querying)
        ...(templateContext?.templateType === 'wish-button' ? {
          template: 'wish-button',
          child_name: templateContext.childName,
          asset_purpose: templateContext.assetPurpose, // Save as asset_purpose for wish-button assets
          page: templateContext.assetPurpose // Also save as page for consistency
        } : {})
      },
    };

    console.log('Attempting to create asset with data:', {
      type: assetData.type,
      theme: assetData.theme,
      tags: assetData.tags,
      status: assetData.status,
      hasFileUrl: !!assetData.file_url,
      metadataKeys: Object.keys(assetData.metadata),
      metadataSize: JSON.stringify(assetData.metadata).length,
      hasAudioData: !!assetData.metadata.audio_data,
      templateType: templateContext?.templateType,
      excludedAudioDataForWishButton: templateContext?.templateType === 'wish-button'
    });

    const { data: assetRecord, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert(assetData)
      .select()
      .single();

    if (assetError) {
      console.error('Error creating asset:', assetError);
      console.error('Asset data that failed:', assetData);
      return res.status(500).json({ 
        error: 'Failed to create asset',
        details: assetError.message,
        code: assetError.code
      });
    }

    console.log('Audio asset created successfully:', assetRecord.id);

    return res.status(200).json({
      success: true,
      asset: assetRecord,
      audioData: assetData.metadata.audio_data,
      generationInfo: {
        voiceId,
        speed,
        scriptLength: script.length,
        audioSize: audioData.length,
      },
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 