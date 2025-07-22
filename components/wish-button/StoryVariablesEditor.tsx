import React from 'react';
import { StoryVariables } from '@/types/wish-button';

interface StoryVariablesEditorProps {
  variables: StoryVariables;
  onUpdateVariable: (key: keyof StoryVariables, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  generatingVariables: boolean;
  generatingPrompts: boolean;
  generatedPrompts: { [key: string]: { image: string; audio: string; safeZone: string } } | null;
  onViewPrompts: () => void;
}

export const StoryVariablesEditor: React.FC<StoryVariablesEditorProps> = ({
  variables,
  onUpdateVariable,
  onNext,
  onBack,
  generatingVariables,
  generatingPrompts,
  generatedPrompts,
  onViewPrompts
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Story Variables</h1>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      {generatingVariables && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800">Generating story variables...</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <textarea
              value={value}
              onChange={(e) => onUpdateVariable(key as keyof StoryVariables, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={key === 'childName' ? 1 : 3}
              placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onNext}
          disabled={generatingPrompts || !variables.childName.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {generatingPrompts ? 'Generating...' : 'Generate Story Prompts'}
        </button>
      </div>
      
      {/* Navigation for loaded stories */}
      {generatedPrompts && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              ← Back to Stories
            </button>
            <button
              onClick={onViewPrompts}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              View Prompts →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
