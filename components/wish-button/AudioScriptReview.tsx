import React from 'react';

interface AudioScriptReviewProps {
  generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } };
  onSetGeneratedPrompts: (prompts: { [key: string]: { image: string; audio: string; safeZone: string } }) => void;
  onBack: () => void;
  onNext: () => void;
}

export const AudioScriptReview: React.FC<AudioScriptReviewProps> = ({
  generatedPrompts,
  onSetGeneratedPrompts,
  onBack,
  onNext
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6a: Review Audio Scripts</h2>
      
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Audio Script Review</h3>
          <p className="text-sm text-blue-700 mb-2">
            Review and edit the audio scripts for Pages 1-2 before generating the actual audio. These scripts will be converted to speech using ElevenLabs voice synthesis.
          </p>
          <div className="text-xs text-blue-600">
            💡 Tip: Scripts are automatically saved as you edit them. Click "Generate Audio →" when ready to proceed to audio generation.
          </div>
        </div>

        {/* Background Music Section */}
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">🎼 Wish Button Background Music</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                Pre-approved
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Using existing approved background music track (ID: a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9)
            </p>
            <div className="text-xs text-green-600">
              ✅ Background music is already approved and ready to use
            </div>
          </div>
        </div>

        {/* Audio Scripts - Pages 1-2 only for testing */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Audio Scripts (Testing with Pages 1-2)</h3>
          
          {(['page1', 'page2'] as const).map((page) => {
            const pageNum = parseInt(page.replace('page', ''));
            const pagePrompts = generatedPrompts[page];
            
            if (!pagePrompts) return null;
            
            return (
              <div key={page} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">
                  🎤 Page {pageNum} Audio Script
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Narration Script
                    </label>
                    <textarea
                      value={pagePrompts.audio}
                      onChange={(e) => {
                        onSetGeneratedPrompts({
                          ...generatedPrompts,
                          [page]: { ...generatedPrompts[page], audio: e.target.value }
                        });
                        // Note: For production, consider debounced API call to update prompts in database
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Enter the narration script for this page..."
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Character count: {pagePrompts.audio.length} | Estimated duration: ~{Math.ceil(pagePrompts.audio.length / 15)} seconds
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Disabled pages for testing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
              const pageNum = parseInt(page.replace('page', ''));
              return (
                <div key={page} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    🎤 Page {pageNum} Audio Script
                  </h4>
                  <div className="bg-gray-100 p-3 rounded text-sm text-gray-500">
                    Disabled for testing - focusing on Pages 1-2 only
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            Back to Image Review
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Generate Audio →
          </button>
        </div>
      </div>
    </div>
  );
};
