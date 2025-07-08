import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { s3Client, S3_BUCKETS } from '@/lib/aws';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assetId, status, outputUrl, error } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: 'Missing assetId' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (status === 'completed' && outputUrl) {
      // Video rendering completed successfully
      const { error: updateError } = await supabaseAdmin
        .from('assets')
        .update({
          status: 'completed',
          metadata: {
            ...req.body,
            completed_at: new Date().toISOString(),
            video_url: outputUrl,
          },
        })
        .eq('id', assetId);

      if (updateError) {
        console.error('Error updating video asset:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update video asset',
          details: updateError.message 
        });
      }

      console.log(`Video asset ${assetId} completed successfully`);
    } else if (status === 'failed') {
      // Video rendering failed
      const { error: updateError } = await supabaseAdmin
        .from('assets')
        .update({
          status: 'failed',
          metadata: {
            ...req.body,
            failed_at: new Date().toISOString(),
            error: error || 'Unknown rendering error',
          },
        })
        .eq('id', assetId);

      if (updateError) {
        console.error('Error updating video asset:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update video asset',
          details: updateError.message 
        });
      }

      console.error(`Video asset ${assetId} failed:`, error);
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Video webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 