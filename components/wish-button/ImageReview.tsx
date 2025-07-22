import React from 'react';
import { WishButtonAssets } from '@/types/wish-button';

interface ImageReviewProps {
  assets: WishButtonAssets;
  onGenerateImage: (page: string) => void;
  onOpenAssetModal: (asset: any) => void;
  onRefreshAssets: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const ImageReview: React.FC<ImageReviewProps> = ({
  assets,
  onGenerateImage,
  onOpenAssetModal,
  onRefreshAssets,
  onBack,
  onNext
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Review Generated Images</h2>
      
      <div className="space-y-6">
        {/* Review Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-900 mb-2">Image Review Instructions</h3>
          <p className="text-sm text-yellow-700">
            Click "Review" to open the detailed asset review modal. You can approve, reject, or regenerate images using the same workflow as the main asset management system.
          </p>
        </div>

        {/* Refresh Assets Button */}
        <div className="mb-6">
          <button
            onClick={onRefreshAssets}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Refresh Assets
          </button>
        </div>

        {/* Image Review Grid - Currently limited to Page 1 and 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(['page1', 'page2'] as const).map((page) => {
            const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
            const pageNumber = parseInt(page.replace('page', ''));
            
            return (
              <div key={page} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Image Display */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  {imageAsset.status === 'ready' && imageAsset.url ? (
                    <img 
                      src={imageAsset.url} 
                      alt={imageAsset.name}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => imageAsset.id && onOpenAssetModal({ 
                        id: imageAsset.id, 
                        url: imageAsset.url,
                        type: 'image',
                        title: imageAsset.name,
                        status: imageAsset.status,
                        metadata: { page: pageNumber }
                      })}
                    />
                  ) : imageAsset.status === 'pending_review' && imageAsset.url ? (
                    <img 
                      src={imageAsset.url} 
                      alt={imageAsset.name}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => imageAsset.id && onOpenAssetModal({ 
                        id: imageAsset.id, 
                        url: imageAsset.url,
                        type: 'image',
                        title: imageAsset.name,
                        status: imageAsset.status,
                        metadata: { page: pageNumber }
                      })}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">
                        {imageAsset.status === 'generating' ? 'Generating...' : 'No image available'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Image Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">Page {pageNumber}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${
                      imageAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                      imageAsset.status === 'approved' ? 'bg-green-100 text-green-800' :
                      imageAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                      imageAsset.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {imageAsset.status === 'pending_review' ? 'Ready for Review' : 
                       imageAsset.status === 'ready' ? 'Ready' : imageAsset.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{imageAsset.description}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      disabled={imageAsset.status === 'generating'}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                        imageAsset.status === 'generating' 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      onClick={() => onGenerateImage(page)}
                    >
                      {imageAsset.status === 'generating' ? 'Generating...' : 'Regenerate'}
                    </button>
                    
                    {(imageAsset.status === 'ready' || imageAsset.status === 'pending_review' || imageAsset.status === 'approved') && imageAsset.id && (
                      <button
                        className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                        onClick={() => onOpenAssetModal({ 
                          id: imageAsset.id, 
                          url: imageAsset.url,
                          type: 'image',
                          title: imageAsset.name,
                          status: imageAsset.status,
                          metadata: { page: pageNumber }
                        })}
                      >
                        Review
                      </button>
                    )}
                  </div>
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
            ← Back to Images
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Continue to Audio →
          </button>
        </div>
      </div>
    </div>
  );
};
