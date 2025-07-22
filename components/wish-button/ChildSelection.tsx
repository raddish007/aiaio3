import React from 'react';
import { Child } from '@/types/wish-button';

interface ChildSelectionProps {
  children: Child[];
  loading: boolean;
  onChildSelect: (child: Child) => void;
}

export const ChildSelection: React.FC<ChildSelectionProps> = ({
  children,
  loading,
  onChildSelect
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading children...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Select a Child for Wish Button Story
      </h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div
            key={child.id}
            onClick={() => onChildSelect(child)}
            className="p-6 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">{child.name}</h3>
            <p className="text-gray-600 mb-1">Age: {child.age}</p>
            <p className="text-gray-600 mb-1">Interest: {child.primary_interest}</p>
            {child.theme && (
              <p className="text-gray-600 mb-1">Theme: {child.theme}</p>
            )}
            {child.pronouns && (
              <p className="text-gray-600">Pronouns: {child.pronouns}</p>
            )}
          </div>
        ))}
      </div>
      
      {children.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No children found. Please add children to the system first.
        </div>
      )}
    </div>
  );
};
