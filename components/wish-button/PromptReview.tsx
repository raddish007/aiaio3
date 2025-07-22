import { useState } from 'react';

interface PromptReviewProps {
  generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } } | null;
  generatingPrompts: boolean;
  promptProgress: {
    current: number;
    total: number;
    currentPage?: string;
  };
  onSetGeneratedPrompts: (prompts: { [key: string]: { image: string; audio: string; safeZone: string } } | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PromptReview({
  generatedPrompts,
  generatingPrompts,
  promptProgress,
  onSetGeneratedPrompts,
  onBack,
  onNext
}: PromptReviewProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Story Prompts Generated</h2>
      
      {generatingPrompts ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating illustration prompts for all 9 pages...</p>
          
          {/* Progress Information */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="text-sm text-gray-500 mb-2">
              {promptProgress.currentPage && `Current: ${promptProgress.currentPage}`}
            </div>
            
            {promptProgress.total > 0 && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(promptProgress.current / promptProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {promptProgress.current} of {promptProgress.total} pages
                </div>
              </>
            )}
            
            <div className="text-xs text-gray-400 mt-3">
              ⏱️ This typically takes 30-60 seconds
            </div>
          </div>
        </div>
      ) : generatedPrompts ? (
        <div className="space-y-6">
          <p className="text-green-600">✅ Generated prompts for all 9 pages</p>
          
          {/* Prompts Display */}
          <div className="space-y-4">
            {Object.entries(generatedPrompts).map(([page, prompts]) => (
              <div key={page} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 capitalize">{page.replace('page', 'Page ')} Prompts</h3>
                
                <div className="space-y-3">
                  {/* Image Prompt */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">🎨 Image Prompt</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Safe Zone: {prompts.safeZone}</span>
                        <button
                          onClick={() => setExpandedPrompt(expandedPrompt === `${page}_image` ? null : `${page}_image`)}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          {expandedPrompt === `${page}_image` ? 'Collapse' : 'View Full'}
                        </button>
                      </div>
                    </div>
                    <div className={`${expandedPrompt === `${page}_image` ? '' : 'max-h-20 overflow-hidden'} transition-all`}>
                      <textarea
                        value={prompts.image}
                        onChange={(e) => {
                          onSetGeneratedPrompts({
                            ...generatedPrompts,
                            [page]: { ...generatedPrompts[page], image: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={expandedPrompt === `${page}_image` ? 8 : 3}
                      />
                    </div>
                  </div>

                  {/* Audio Script */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">🎤 Audio Script</h4>
                      <button
                        onClick={() => setExpandedPrompt(expandedPrompt === `${page}_audio` ? null : `${page}_audio`)}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      >
                        {expandedPrompt === `${page}_audio` ? 'Collapse' : 'Edit'}
                      </button>
                    </div>
                    <div className={`${expandedPrompt === `${page}_audio` ? '' : 'max-h-16 overflow-hidden'} transition-all`}>
                      <textarea
                        value={prompts.audio}
                        onChange={(e) => {
                          onSetGeneratedPrompts({
                            ...generatedPrompts,
                            [page]: { ...generatedPrompts[page], audio: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={expandedPrompt === `${page}_audio` ? 4 : 2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Back to Variables
            </button>
            <button
              onClick={onNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Continue to Image Generation
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No prompts generated yet</p>
        </div>
      )}
    </div>
  );
}
