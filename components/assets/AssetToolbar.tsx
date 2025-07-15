import React from 'react';
import { ViewMode } from '@/lib/assets/asset-types';

interface AssetToolbarProps {
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Upload actions
  onSingleUpload: () => void;
  onBulkUpload: () => void;
  
  // Bulk actions
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkDelete: () => void;
  
  // Loading states
  isUploading?: boolean;
  isBulkProcessing?: boolean;
}

export function AssetToolbar({
  viewMode,
  onViewModeChange,
  onSingleUpload,
  onBulkUpload,
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  isUploading = false,
  isBulkProcessing = false,
}: AssetToolbarProps) {
  const viewModes: { value: ViewMode; label: string }[] = [
    { value: 'all', label: 'All Assets' },
    { value: 'review', label: 'Review Queue' },
    { value: 'viewer', label: 'Viewer Mode' },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {viewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onViewModeChange(mode.value)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === mode.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex gap-2 border-r border-gray-200 pr-2">
              <span className="text-sm text-gray-600 self-center">
                {selectedCount} selected
              </span>
              <button
                onClick={onBulkApprove}
                disabled={isBulkProcessing}
                className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkProcessing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={onBulkReject}
                disabled={isBulkProcessing}
                className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkProcessing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={onBulkDelete}
                disabled={isBulkProcessing}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkProcessing ? 'Processing...' : 'Delete'}
              </button>
            </div>
          )}

          {/* Upload Actions */}
          <div className="flex gap-2">
            <button
              onClick={onSingleUpload}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Asset'}
            </button>
            <button
              onClick={onBulkUpload}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Bulk Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
