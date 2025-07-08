import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

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
    const { script, voiceId, speed, style, projectId, isPersonalized } = req.body;

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

    console.log('Starting audio generation with ElevenLabs...');

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

    console.log('Audio generated successfully, creating asset record...');

    console.log('Audio generated successfully, creating asset record...');

    // Create the asset record with audio data stored in metadata instead of file_url
    const assetData = {
      type: 'audio',
      theme: isPersonalized ? `Personalized Audio - ${voiceId}` : `Custom Audio - ${voiceId}`,
      tags: [style, 'elevenlabs', voiceId, isPersonalized ? 'personalized' : null].filter(Boolean),
      status: 'pending',
      file_url: '', // Leave empty since we store audio in metadata
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
        script: script, // Store script for regeneration
        audio_data: `data:audio/mpeg;base64,${audioData.toString('base64')}`, // Store audio in metadata
      },
    };

    console.log('Attempting to create asset with data:', {
      type: assetData.type,
      theme: assetData.theme,
      tags: assetData.tags,
      status: assetData.status,
      hasFileUrl: !!assetData.file_url,
      metadataKeys: Object.keys(assetData.metadata),
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