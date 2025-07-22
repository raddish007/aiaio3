import React from 'react';
import { WishButtonAssets } from '@/types/wish-button';

interface AudioGenerationProps {
  assets: WishButtonAssets;
  onGenerateAudio: (page: string) => void;
  onOpenAssetModal: (asset: any) => void;
  onRefreshAssets: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const AudioGeneration: React.FC<AudioGenerationProps> = ({
  assets,
  onGenerateAudio,
  onOpenAssetModal,
  onRefreshAssets,
  onBack,
  onNext
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6b: Generate & Moderate Audio</h2>
      
      <div className="space-y-6">
        {/* Generation Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-green-900">Audio Generation Status</h3>
            <button
              onClick={onRefreshAssets}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              🔄 Refresh Assets
            </button>
          </div>
          <p className="text-sm text-green-700 mb-2">
            Generate audio for Pages 1-2 using the reviewed scripts. Background music is pre-approved and ready to use.
          </p>
          <div className="text-xs text-green-600">
            💡 If generation fails due to ElevenLabs being busy, click "Retry Generation" to try again.
          </div>
        </div>

        {/* Background Music - Pre-approved */}
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">🎼 Wish Button Background Music</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                Approved
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Using existing approved background music (ID: a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9)
            </p>
            <div className="text-xs text-green-600">
              ✅ Ready to use in video compilation
            </div>
          </div>
        </div>

        {/* Page Audio Generation - Pages 1-2 only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['page1', 'page2'] as const).map((page) => {
            const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
            const pageNum = parseInt(page.replace('page', ''));
            
            return (
              <div key={page} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  🎤 Page {pageNum} Audio
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    audioAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                    audioAsset.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                    audioAsset.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    audioAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                    audioAsset.status === 'approved' ? 'bg-green-100 text-green-800' :
                    audioAsset.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {audioAsset.status === 'pending_review' ? 'Ready for Review' : 
                     audioAsset.status === 'pending' ? 'Ready for Review' :
                     audioAsset.status === 'failed' ? 'Failed - Retry' : audioAsset.status}
                  </span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">{audioAsset.description}</p>
                
                {(audioAsset.status === 'ready' || audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'approved') && audioAsset.url && (
                  <div className="mb-3 border border-gray-200 rounded p-2">
                    <audio controls className="w-full">
                      <source src={audioAsset.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    disabled={audioAsset.status === 'generating'}
                    onClick={() => onGenerateAudio(page)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                      audioAsset.status === 'generating' 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : audioAsset.status === 'failed'
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {audioAsset.status === 'generating' ? 'Generating...' : 
                     audioAsset.status === 'failed' ? 'Retry Generation' :
                     (audioAsset.status === 'ready' || audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'approved') ? 'Regenerate' : 'Generate'}
                  </button>
                  
                  {(audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'ready') && audioAsset.id && (
                    <button
                      className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                      onClick={() => {
                        console.log(`🎯 Opening review modal for ${page} audio:`, {
                          id: audioAsset.id,
                          status: audioAsset.status,
                          url: audioAsset.url
                        });
                        onOpenAssetModal({ 
                          id: audioAsset.id, 
                          url: audioAsset.url,
                          type: 'audio',
                          title: `Page ${pageNum} Audio`,
                          status: audioAsset.status,
                          metadata: { page: pageNum }
                        });
                      }}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            ← Back to Audio Scripts
          </button>
          <button
            onClick={onNext}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Submit for Video →
          </button>
        </div>
      </div>
    </div>
  );
};
