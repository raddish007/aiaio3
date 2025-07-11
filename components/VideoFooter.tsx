import React from 'react';

interface VideoFooterProps {
  copyrightText?: string;
}

export default function VideoFooter({ copyrightText = "© 2024 Nolan's Videos" }: VideoFooterProps) {
  return (
    <footer className="header-footer mt-auto">
      <p className="text-sm">{copyrightText}</p>
    </footer>
  );
} 