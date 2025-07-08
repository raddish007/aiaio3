import React, { useState, useEffect, useCallback } from 'react';

interface UploadJob {
  id: string;
  filename: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface BackgroundUploadManagerProps {
  isVisible: boolean;
  onClose: () => void;
  uploadJobs: UploadJob[];
  onMinimize: () => void;
  onMaximize: () => void;
  isMinimized: boolean;
}

export default function BackgroundUploadManager({
  isVisible,
  onClose,
  uploadJobs,
  onMinimize,
  onMaximize,
  isMinimized
}: BackgroundUploadManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  const completedJobs = uploadJobs.filter(job => job.status === 'completed').length;
  const failedJobs = uploadJobs.filter(job => job.status === 'failed').length;
  const pendingJobs = uploadJobs.filter(job => job.status === 'pending').length;
  const uploadingJobs = uploadJobs.filter(job => job.status === 'uploading').length;
  const totalJobs = uploadJobs.length;

  const overallProgress = totalJobs > 0 ? ((completedJobs + failedJobs) / totalJobs) * 100 : 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow"
        style={{ width: '300px' }}
        onClick={onMaximize}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Upload Progress</h3>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ⬆️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{completedJobs + failedJobs} / {totalJobs}</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-green-600">✅ {completedJobs}</span>
            <span className="text-red-600">❌ {failedJobs}</span>
            <span className="text-blue-600">⏳ {uploadingJobs}</span>
            <span className="text-gray-600">⏸️ {pendingJobs}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px',
        maxHeight: '500px'
      }}
    >
      {/* Header */}
      <div
        className="bg-gray-50 px-4 py-3 rounded-t-lg cursor-move flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-lg font-semibold text-gray-900">Upload Progress</h3>
        <div className="flex space-x-2">
          <button
            onClick={onMinimize}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Minimize"
          >
            ⬇️
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 p-1"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>✅ {completedJobs} completed</span>
            <span>❌ {failedJobs} failed</span>
            <span>⏳ {uploadingJobs} uploading</span>
            <span>⏸️ {pendingJobs} pending</span>
          </div>
        </div>

        {/* Individual Jobs */}
        <div className="space-y-2">
          {uploadJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {job.filename}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                  job.status === 'failed' ? 'bg-red-100 text-red-800' :
                  job.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              
              {job.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
              
              {job.error && (
                <p className="text-xs text-red-600 mt-1">{job.error}</p>
              )}
            </div>
          ))}
        </div>

        {uploadJobs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No upload jobs in progress
          </div>
        )}
      </div>
    </div>
  );
} 