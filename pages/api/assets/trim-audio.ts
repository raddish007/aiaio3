import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalAssetId, startTime, endTime, originalAudioData, trimmedAudioData, theme, template, title } = req.body;

    if (!originalAssetId || startTime === undefined || endTime === undefined || !originalAudioData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate time range
    if (startTime >= endTime || (endTime - startTime) < 0.5) {
      return res.status(400).json({ error: 'Invalid time range. Segment must be at least 0.5 seconds.' });
    }

    // Use client-side trimmed audio data if provided, otherwise fall back to server-side trimming
    let finalTrimmedAudioData: string;
    
    if (trimmedAudioData) {
      // Use the client-side trimmed audio data
      finalTrimmedAudioData = trimmedAudioData;
      console.log('Using client-side trimmed audio data');
    } else {
      // Fall back to server-side trimming (for backward compatibility)
      const base64Data = originalAudioData.replace(/^data:audio\/[^;]+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      console.log('Audio trimming parameters:', {
        originalAssetId,
        startTime,
        endTime,
        originalAudioSize: audioBuffer.length,
        theme,
        duration: endTime - startTime,
        isShortFile: audioBuffer.length < 500000
      });
      
      finalTrimmedAudioData = await trimAudio(audioBuffer, startTime, endTime);
    }
    
    console.log('Final trimmed audio size:', finalTrimmedAudioData.length);

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    // Get the original asset to extract script and template info
    const { data: originalAsset } = await supabaseAdmin
      .from('assets')
      .select('metadata')
      .eq('id', originalAssetId)
      .single();

    const originalScript = originalAsset?.metadata?.script || 'Unknown script';
    const originalTemplate = template || originalAsset?.metadata?.template || 'general';
    
    // Use custom title if provided, otherwise create from script
    const finalTitle = title || (originalScript.length > 50 
      ? originalScript.substring(0, 50) + '...' 
      : originalScript);

    // Create new asset record using admin client to bypass RLS
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert({
        type: 'audio',
        theme: finalTitle,
        status: 'pending',
        metadata: {
          original_asset_id: originalAssetId,
          start_time: startTime,
          end_time: endTime,
          duration: endTime - startTime,
          audio_data: `data:audio/wav;base64,${finalTrimmedAudioData}`,
          script: originalScript,
          template: originalTemplate,
          voice: 'trimmed',
          speed: 1.0,
          trim_info: {
            original_theme: theme,
            start_time: startTime,
            end_time: endTime,
            duration: endTime - startTime,
          },
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Error creating trimmed asset:', assetError);
      return res.status(500).json({ 
        error: 'Failed to save trimmed audio',
        details: assetError.message 
      });
    }

    res.status(200).json({
      success: true,
      asset,
      audioData: `data:audio/wav;base64,${finalTrimmedAudioData}`,
    });

  } catch (error) {
    console.error('Audio trimming error:', error);
    res.status(500).json({ 
      error: 'Audio trimming failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function trimAudio(audioBuffer: Buffer, startTime: number, endTime: number): Promise<string> {
  try {
    console.log(`Trim request: ${startTime}s to ${endTime}s (duration: ${endTime - startTime}s)`);
    console.log(`Original audio buffer size: ${audioBuffer.length} bytes`);
    
    // For now, we'll use a more sophisticated approach that creates a proper trimmed file
    // This is still a simplified approach but should be more accurate than byte-level cutting
    
    // Calculate a more accurate byte position based on typical MP3 bitrates
    // Most MP3 files are 128kbps or 192kbps, so we'll estimate based on that
    const estimatedBitrate = 128000; // 128 kbps
    const bytesPerSecond = estimatedBitrate / 8; // Convert to bytes per second
    
    const startByte = Math.floor(startTime * bytesPerSecond);
    const endByte = Math.floor(endTime * bytesPerSecond);
    
    // Ensure we don't go out of bounds
    const actualStartByte = Math.max(0, startByte);
    const actualEndByte = Math.min(audioBuffer.length, endByte);
    
    console.log(`Calculated byte range: ${actualStartByte} to ${actualEndByte} (${actualEndByte - actualStartByte} bytes)`);
    
    // Extract the segment
    const trimmedBuffer = audioBuffer.slice(actualStartByte, actualEndByte);
    
    // Convert to base64
    const base64Data = trimmedBuffer.toString('base64');
    
    console.log(`Trimmed audio size: ${trimmedBuffer.length} bytes, base64 length: ${base64Data.length}`);
    
    // If the trimmed buffer is too small, return the full audio with a warning
    if (trimmedBuffer.length < 1000) {
      console.warn('Trimmed buffer too small, returning full audio');
      return audioBuffer.toString('base64');
    }
    
    return base64Data;
    
  } catch (error) {
    console.error('Error in trimAudio:', error);
    throw new Error('Failed to trim audio');
  }
} 