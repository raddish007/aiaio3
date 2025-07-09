import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { renderId, outputFile, error } = req.body;

    if (!renderId) {
      return res.status(400).json({ error: 'Missing renderId' });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Find the job record by render ID
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .select('*')
      .eq('lambda_request_id', renderId)
      .single();

    if (jobError || !jobRecord) {
      console.error('Job not found for renderId:', renderId);
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status based on webhook data
    if (error) {
      // Render failed
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: error,
          failed_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);

      console.log(`Job ${jobRecord.id} failed:`, error);
    } else if (outputFile) {
      // Render completed successfully
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'completed',
          output_url: outputFile,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);

      console.log(`Job ${jobRecord.id} completed with output:`, outputFile);
    } else {
      // Unknown state
      console.warn(`Job ${jobRecord.id} webhook received but no outputFile or error provided`);
    }

    return res.status(200).json({ 
      success: true, 
      job_id: jobRecord.id,
      status: error ? 'failed' : 'completed'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 