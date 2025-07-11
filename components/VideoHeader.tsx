import React from 'react';

interface VideoHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function VideoHeader({ title, showBackButton = false, onBackClick }: VideoHeaderProps) {
  return (
    <header className="header-footer">
      <div className="flex items-center justify-center">
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="control-button absolute left-4"
            style={{ minWidth: '60px', minHeight: '60px' }}
          >
            <div className="text-center">
              <div className="text-2xl">←</div>
              <div className="text-xs">Back</div>
            </div>
          </button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
    </header>
  );
} 