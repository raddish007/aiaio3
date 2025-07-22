import React from 'react';
import { WishButtonAssets, PromptProgress } from '@/types/wish-button';

interface AssetManagementProps {
  assets: WishButtonAssets;
  generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } } | null;
  promptProgress: PromptProgress;
  expandedPrompt: string | null;
  generatingPrompts: boolean;
  onSetExpandedPrompt: (promptKey: string | null) => void;
  onGenerateImage: (page: string) => void;
  onGenerateAudio: (page: string) => void;
  onOpenAssetModal: (asset: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export const AssetManagement: React.FC<AssetManagementProps> = ({
  assets,
  generatedPrompts,
  promptProgress,
  expandedPrompt,
  generatingPrompts,
  onSetExpandedPrompt,
  onGenerateImage,
  onGenerateAudio,
  onOpenAssetModal,
  onBack,
  onNext
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'approved':
        return 'text-green-600';
      case 'generating':
        return 'text-blue-600';
      case 'pending':
      case 'pending_review':
        return 'text-yellow-600';
      case 'failed':
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
      case 'approved':
        return '✅';
      case 'generating':
        return '⏳';
      case 'pending':
      case 'pending_review':
        return '⏰';
      case 'failed':
      case 'rejected':
        return '❌';
      default:
        return '⚪';
    }
  };

  const renderAssetRow = (page: string, pageNumber: number) => {
    const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
    const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
    const prompts = generatedPrompts?.[page];

    return (
      <div key={page} className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Page {pageNumber}</h3>
          {prompts && (
            <button
              onClick={() => onSetExpandedPrompt(expandedPrompt === page ? null : page)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {expandedPrompt === page ? 'Hide' : 'Show'} Prompts
            </button>
          )}
        </div>

        {expandedPrompt === page && prompts && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="mb-2">
              <strong>Image Prompt:</strong>
              <p className="mt-1">{prompts.image}</p>
            </div>
            <div className="mb-2">
              <strong>Audio Prompt:</strong>
              <p className="mt-1">{prompts.audio}</p>
            </div>
            <div>
              <strong>Safe Zone:</strong>
              <p className="mt-1">{prompts.safeZone}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Image Asset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Image</span>
              <span className={`text-sm ${getStatusColor(imageAsset.status)}`}>
                {getStatusIcon(imageAsset.status)} {imageAsset.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{imageAsset.description}</p>
            <div className="flex gap-2">
              {imageAsset.status === 'missing' && (
                <button
                  onClick={() => onGenerateImage(page)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Generate
                </button>
              )}
              {(imageAsset.status === 'pending_review' || imageAsset.status === 'pending' || imageAsset.status === 'ready') && imageAsset.id && (
                <button
                  onClick={() => onOpenAssetModal(imageAsset)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Review
                </button>
              )}
              {imageAsset.url && (
                <a
                  href={imageAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  View
                </a>
              )}
            </div>
          </div>

          {/* Audio Asset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Audio</span>
              <span className={`text-sm ${getStatusColor(audioAsset.status)}`}>
                {getStatusIcon(audioAsset.status)} {audioAsset.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{audioAsset.description}</p>
            <div className="flex gap-2">
              {audioAsset.status === 'missing' && (
                <button
                  onClick={() => onGenerateAudio(page)}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                >
                  Generate
                </button>
              )}
              {(audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'ready') && audioAsset.id && (
                <button
                  onClick={() => onOpenAssetModal(audioAsset)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Review
                </button>
              )}
              {audioAsset.url && (
                <audio controls className="w-full max-w-xs">
                  <source src={audioAsset.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Asset Management</h1>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      {generatingPrompts && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              Generating prompts... {promptProgress.current > 0 && `(${promptProgress.current}/${promptProgress.total})`}
              {promptProgress.currentPage && ` - ${promptProgress.currentPage}`}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Story Pages */}
        {['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'].map((page, index) => 
          renderAssetRow(page, index + 1)
        )}

        {/* Background Music */}
        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="text-lg font-semibold mb-4">Background Music</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Background Music</span>
              <span className={`text-sm ${getStatusColor(assets.background_music.status)}`}>
                {getStatusIcon(assets.background_music.status)} {assets.background_music.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{assets.background_music.description}</p>
            {assets.background_music.url && (
              <audio controls className="w-full max-w-md">
                <source src={assets.background_music.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Continue to Video Submission
        </button>
      </div>
    </div>
  );
};
