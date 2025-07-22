import React from 'react';
import { WishButtonPayload, VideoSubmissionResult } from '@/types/wish-button';

interface VideoSubmissionProps {
  payload: WishButtonPayload | null;
  submittingVideo: boolean;
  videoSubmissionResult: VideoSubmissionResult | null;
  canSubmitVideo: boolean;
  onSubmitVideo: () => void;
  onBack: () => void;
}

export const VideoSubmission: React.FC<VideoSubmissionProps> = ({
  payload,
  submittingVideo,
  videoSubmissionResult,
  canSubmitVideo,
  onSubmitVideo,
  onBack
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Video Submission</h1>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      {payload && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Story Summary</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Child:</strong> {payload.childName}</p>
              <p><strong>Theme:</strong> {payload.theme}</p>
              <p><strong>Template:</strong> {payload.metadata.template}</p>
              <p><strong>Version:</strong> {payload.metadata.version}</p>
            </div>
            <div>
              <p><strong>Main Character:</strong> {payload.storyVariables.mainCharacter}</p>
              <p><strong>Visual Style:</strong> {payload.storyVariables.visualStyle}</p>
              <p><strong>Magic Button:</strong> {payload.storyVariables.magicButton}</p>
              <p><strong>Button Location:</strong> {payload.storyVariables.buttonLocation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Asset Status Summary</h2>
        {payload && (
          <div className="space-y-2 text-sm">
            {Object.entries(payload.assets).map(([key, asset]) => (
              <div key={key} className="flex justify-between items-center py-1">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  asset.status === 'ready' || asset.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {asset.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!canSubmitVideo && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">
            ⚠️ Not all required assets are ready. Please ensure all assets are approved before submitting to video pipeline.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
        >
          Back to Asset Management
        </button>
        <button
          onClick={onSubmitVideo}
          disabled={submittingVideo || !canSubmitVideo}
          className={`px-6 py-2 rounded-md font-medium ${
            canSubmitVideo && !submittingVideo
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submittingVideo ? 'Submitting to Remotion...' : 'Submit to Video Pipeline'}
        </button>
      </div>

      {/* Video Submission Results */}
      {videoSubmissionResult && (
        <div className="mt-8 p-6 rounded-lg border-2 border-blue-500 bg-blue-50">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Video Submission Status
          </h2>
          {videoSubmissionResult.success ? (
            <div className="text-green-800">
              <p className="font-medium">✅ Video submission successful!</p>
              <p>Job ID: {videoSubmissionResult.job_id}</p>
              <p className="mt-2 text-sm">
                Your video is being processed. You can check the status in the video management panel.
              </p>
            </div>
          ) : (
            <div className="text-red-800">
              <p className="font-medium">❌ Video submission failed</p>
              <p className="mt-2">Error: {videoSubmissionResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
