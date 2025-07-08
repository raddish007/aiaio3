import { NextApiRequest, NextApiResponse } from 'next';
import { lambdaClient, S3_BUCKETS, LAMBDA_FUNCTIONS } from '@/lib/aws';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      compositionId, 
      childName, 
      theme, 
      age, 
      letter, 
      segmentType, 
      segmentTitle,
      userId 
    } = req.body;

    // Validate required parameters
    if (!compositionId || !childName || !theme || !age) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate composition ID
    const validCompositions = ['NameVideo', 'BedtimeSong', 'LetterHunt', 'EpisodeSegment'];
    if (!validCompositions.includes(compositionId)) {
      return res.status(400).json({ error: 'Invalid composition ID' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create video asset record
    const { data: videoAsset, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert({
        type: 'video',
        theme: `${childName}'s ${compositionId}`,
        status: 'pending',
        metadata: {
          composition_id: compositionId,
          child_name: childName,
          theme: theme,
          age: age,
          letter: letter,
          segment_type: segmentType,
          segment_title: segmentTitle,
          user_id: userId,
          render_params: {
            compositionId,
            inputProps: {
              childName,
              theme,
              age,
              letter,
              segmentType,
              segmentTitle,
            },
          },
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Error creating video asset:', assetError);
      return res.status(500).json({ 
        error: 'Failed to create video asset',
        details: assetError.message 
      });
    }

    // Update asset with cloud storage paths
    const { error: updateError } = await supabaseAdmin
      .from('assets')
      .update({
        metadata: {
          ...videoAsset?.metadata,
          asset_paths: {
            images: `assets/images/${videoAsset.id}`,
            audio: `assets/audio/${videoAsset.id}`,
            output: `videos/${videoAsset.id}`,
          },
        },
      })
      .eq('id', videoAsset.id);

    if (updateError) {
      console.error('Error updating video asset with storage paths:', updateError);
      // Continue anyway as this is not critical
    }

    // Prepare Lambda payload
    const lambdaPayload = {
      compositionId,
      inputProps: {
        childName,
        theme,
        age,
        letter,
        segmentType,
        segmentTitle,
      },
      outputBucket: S3_BUCKETS.VIDEOS,
      outputKey: `videos/${videoAsset.id}/${compositionId}-${Date.now()}.mp4`,
      assetId: videoAsset.id,
    };

    // Invoke Lambda function for video rendering
    const invokeCommand = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTIONS.REMOTION_RENDER,
      Payload: JSON.stringify(lambdaPayload),
      InvocationType: 'Event', // Async invocation
    });

    try {
      await lambdaClient.send(invokeCommand);
      console.log('Lambda function invoked successfully for video rendering');
    } catch (lambdaError) {
      console.error('Error invoking Lambda function:', lambdaError);
      
      // Update asset status to failed
      await supabaseAdmin
        .from('assets')
        .update({ status: 'failed' })
        .eq('id', videoAsset.id);

      return res.status(500).json({ 
        error: 'Failed to start video rendering',
        details: lambdaError instanceof Error ? lambdaError.message : 'Unknown error'
      });
    }

    res.status(200).json({
      success: true,
      videoAsset,
      message: 'Video generation started successfully',
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 