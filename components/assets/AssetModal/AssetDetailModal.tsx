import React, { useEffect } from 'react';
import { Asset } from '@/lib/assets/asset-types';
import { formatDate, formatFileSize, getAssetTypeIcon } from '@/lib/assets/asset-utils';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onApprove?: (asset: Asset) => void;
  onReject?: (asset: Asset) => void;
}

// Icon renderer function for asset types
function renderAssetIcon(iconType: string) {
  switch (iconType) {
    case 'image':
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case 'video':
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'prompt':
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onApprove,
  onReject,
}: AssetDetailModalProps) {
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'a':
        case 'A':
          if (asset && onApprove) {
            onApprove(asset);
          }
          break;
        case 'r':
        case 'R':
          if (asset && onReject) {
            onReject(asset);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, asset, onClose, onNext, onPrevious, onApprove, onReject]);

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close (Esc)
            </button>
            
            {/* Navigation */}
            <div className="flex space-x-2 sm:mr-3">
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                >
                  ← Previous
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                >
                  Next →
                </button>
              )}
            </div>

            {/* Review Actions */}
            {asset.status === 'pending' && (
              <div className="flex space-x-2 sm:mr-3">
                {onApprove && (
                  <button
                    onClick={() => onApprove(asset)}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                  >
                    Approve (A)
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(asset)}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                  >
                    Reject (R)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Media Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Asset Preview</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {asset.type === 'image' && asset.file_url ? (
                    <img
                      src={asset.file_url}
                      alt={asset.title || 'Asset'}
                      className="mx-auto max-h-96 max-w-full object-contain rounded"
                    />
                  ) : asset.type === 'video' && asset.file_url ? (
                    <video
                      src={asset.file_url}
                      controls
                      className="mx-auto max-h-96 max-w-full rounded"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : asset.type === 'audio' && asset.file_url ? (
                    <div className="space-y-4">
                      <div className="text-gray-400">
                        {renderAssetIcon(getAssetTypeIcon(asset.type))}
                      </div>
                      <audio
                        src={asset.file_url}
                        controls
                        className="mx-auto"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-gray-400">
                        {renderAssetIcon(getAssetTypeIcon(asset.type))}
                      </div>
                      <p className="text-gray-500">
                        {asset.file_url ? 'Preview not available' : 'No file URL'}
                      </p>
                    </div>
                  )}
                </div>

                {asset.file_url && (
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </a>
                )}
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Asset Details</h3>
                
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm text-gray-900">{asset.title || 'Untitled Asset'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <div className="flex items-center space-x-2">
                        <div className="text-gray-400">
                          {renderAssetIcon(getAssetTypeIcon(asset.type))}
                        </div>
                        <p className="text-sm text-gray-900 capitalize">{asset.type}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        asset.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : asset.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Theme</label>
                      <p className="text-sm text-gray-900">{asset.theme}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(asset.created_at)}</p>
                    </div>
                  </div>

                  {asset.file_size && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">File Size</label>
                      <p className="text-sm text-gray-900">{formatFileSize(asset.file_size)}</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {asset.metadata && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Additional Metadata</h4>
                    
                    {asset.metadata.template && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Template</label>
                        <p className="text-sm text-gray-900 capitalize">{asset.metadata.template}</p>
                      </div>
                    )}
                    
                    {asset.metadata.child_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Child Name</label>
                        <p className="text-sm text-gray-900">{asset.metadata.child_name}</p>
                      </div>
                    )}
                    
                    {asset.metadata.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm text-gray-900">{asset.metadata.description}</p>
                      </div>
                    )}

                    {asset.metadata.duration && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-sm text-gray-900">{asset.metadata.duration}s</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt */}
                {asset.prompt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Prompt</label>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{asset.prompt}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
