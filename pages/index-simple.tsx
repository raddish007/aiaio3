import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SimpleIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the video library page
    router.push('/video-library');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-orange mx-auto"></div>
        <p className="mt-4 text-primary-dark text-lg font-semibold">Loading Nolan's Videos...</p>
      </div>
    </div>
  );
} 