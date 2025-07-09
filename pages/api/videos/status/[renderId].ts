import { NextApiRequest, NextApiResponse } from 'next';
import { getRenderProgress } from '@remotion/lambda/client';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { renderId } = req.query;

    if (!renderId || typeof renderId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid renderId' });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Get the job record to find the bucket name
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .select('*')
      .eq('lambda_request_id', renderId)
      .single();

    if (jobError || !jobRecord) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get render progress from Remotion Lambda
    const progress = await getRenderProgress({
      renderId,
      bucketName: process.env.AWS_S3_VIDEO_BUCKET || 'aiaio-videos',
      functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION!,
      region: (process.env.AWS_REGION || 'us-east-1') as any
    });

    // Update job status in database based on progress
    let newStatus = jobRecord.status;
    let outputUrl = jobRecord.output_url;
    let errorMessage = jobRecord.error_message;

    if (progress.done) {
      if (progress.outputFile) {
        newStatus = 'completed';
        outputUrl = progress.outputFile;
        
        // Update job record
        await supabaseAdmin
          .from('video_generation_jobs')
          .update({
            status: 'completed',
            output_url: progress.outputFile,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);
      } else if (progress.fatalErrorEncountered) {
        newStatus = 'failed';
        errorMessage = progress.fatalErrorEncountered;
        
        // Update job record
        await supabaseAdmin
          .from('video_generation_jobs')
          .update({
            status: 'failed',
            error_message: progress.fatalErrorEncountered,
            failed_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);
      }
    } else if (progress.overallProgress > 0) {
      newStatus = 'processing';
      
      // Update job record if status changed
      if (jobRecord.status !== 'processing') {
        await supabaseAdmin
          .from('video_generation_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);
      }
    }

    return res.status(200).json({
      render_id: renderId,
      status: newStatus,
      progress: progress.overallProgress,
      output_url: outputUrl,
      error: errorMessage,
      done: progress.done,
      fatal_error: progress.fatalErrorEncountered,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check render status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 