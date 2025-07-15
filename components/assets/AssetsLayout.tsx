import React from 'react';
import AdminHeader from '../AdminHeader';

interface AssetsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AssetsLayout({ 
  children, 
  title = "Asset Management",
  description = "Upload, review, and manage all asset files"
}: AssetsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title={title} subtitle={description} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
