import { useState, useCallback } from 'react';
import { WishButtonPayload, VideoSubmissionResult } from '@/types/wish-button';

export const useWishButtonSubmission = () => {
  const [payload, setPayload] = useState<WishButtonPayload | null>(null);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [videoSubmissionResult, setVideoSubmissionResult] = useState<VideoSubmissionResult | null>(null);

  const submitToRemotionPipeline = useCallback(async () => {
    if (!payload) return;

    setSubmittingVideo(true);
    setVideoSubmissionResult(null);

    try {
      console.log('🎬 Submitting to Remotion pipeline:', payload);

      const response = await fetch('/api/remotion/submit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('📤 Remotion submission result:', result);

      if (response.ok && result.success) {
        setVideoSubmissionResult({
          success: true,
          job_id: result.job_id,
          render_id: result.render_id,
          output_url: result.output_url
        });
      } else {
        setVideoSubmissionResult({
          success: false,
          error: result.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('❌ Error submitting to Remotion:', error);
      setVideoSubmissionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setSubmittingVideo(false);
    }
  }, [payload]);

  const canSubmitVideo = useCallback(() => {
    if (!payload) return false;

    const { assets } = payload;
    if (!assets) return false;

    // Check if all required assets are ready/approved
    const requiredAssets = [
      assets.page1_image,
      assets.page1_audio,
      assets.page2_image,
      assets.page2_audio,
      assets.background_music
    ];

    return requiredAssets.every(asset => 
      asset && (asset.status === 'ready' || asset.status === 'approved') && asset.url
    );
  }, [payload]);

  const resetSubmission = useCallback(() => {
    setPayload(null);
    setSubmittingVideo(false);
    setVideoSubmissionResult(null);
  }, []);

  return {
    payload,
    submittingVideo,
    videoSubmissionResult,
    setPayload,
    submitToRemotionPipeline,
    canSubmitVideo,
    resetSubmission
  };
};
