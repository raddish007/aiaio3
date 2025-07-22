import React from 'react';
import { WishButtonAssets } from '@/types/wish-button';

interface ImageGenerationProps {
  assets: WishButtonAssets;
  onGenerateImage: (page: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ImageGeneration: React.FC<ImageGenerationProps> = ({
  assets,
  onGenerateImage,
  onBack,
  onNext
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Generate Story Images</h2>
      
      <div className="space-y-6">
        {/* Image Generation Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Image Generation Status</h3>
          <p className="text-sm text-blue-700">
            Generating images for all 9 pages. Each image will respect safe zone requirements for text overlay.
          </p>
        </div>

        {/* Page Images - Currently limited to Page 1 and 2 for testing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(['page1', 'page2'] as const).map((page) => {
            const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
            return (
              <div key={page} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  🎨 {imageAsset.name}
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    imageAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                    imageAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {imageAsset.status}
                  </span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">{imageAsset.description}</p>
                
                {imageAsset.status === 'ready' && imageAsset.url && (
                  <div className="mb-3">
                    <img 
                      src={imageAsset.url} 
                      alt={imageAsset.name}
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
                
                <button
                  disabled={imageAsset.status === 'generating'}
                  onClick={() => onGenerateImage(page)}
                  className={`w-full px-4 py-2 rounded text-sm font-medium ${
                    imageAsset.status === 'ready' ? 'bg-green-600 text-white' :
                    imageAsset.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {imageAsset.status === 'ready' ? 'Regenerate' :
                   imageAsset.status === 'generating' ? 'Generating...' : 
                   'Generate Image'}
                </button>
              </div>
            );
          })}
          
          {/* Commented out remaining images for testing */}
          {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
            const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
            return (
              <div key={page} className="border border-gray-200 rounded-lg p-4 opacity-50">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  🎨 {imageAsset.name} 
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                    Disabled for Testing
                  </span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">{imageAsset.description}</p>
                
                <button
                  disabled={true}
                  className="w-full px-4 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Generate Image (Disabled)
                </button>
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
            Back to Prompts
          </button>
          <button
            onClick={onNext}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Review Images →
          </button>
        </div>
      </div>
    </div>
  );
};
