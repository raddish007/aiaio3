import React from 'react';
import { Child, ContentProject } from '@/types/wish-button';

interface PreviousStoriesProps {
  child: Child;
  stories: ContentProject[];
  showPreviousStories: boolean;
  onShowPreviousStories: (show: boolean) => void;
  onLoadStory: (story: ContentProject) => void;
  onDeleteStory: (storyId: string, storyTitle: string) => void;
  onCreateNew: () => void;
  onBack: () => void;
}

export const PreviousStories: React.FC<PreviousStoriesProps> = ({
  child,
  stories,
  showPreviousStories,
  onShowPreviousStories,
  onLoadStory,
  onDeleteStory,
  onCreateNew,
  onBack
}) => {
  const handleDeleteStory = async (storyId: string, storyTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${storyTitle}"? This will also delete all associated assets and cannot be undone.`)) {
      try {
        await onDeleteStory(storyId, storyTitle);
        alert('Story deleted successfully!');
      } catch (error) {
        alert('Failed to delete story. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Wish Button Stories for {child.name}
        </h1>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Back to Child Selection
        </button>
      </div>

      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Child Information</h3>
          <p><strong>Name:</strong> {child.name}</p>
          <p><strong>Age:</strong> {child.age}</p>
          <p><strong>Interest:</strong> {child.primary_interest}</p>
          {child.theme && <p><strong>Theme:</strong> {child.theme}</p>}
          {child.child_description && <p><strong>Description:</strong> {child.child_description}</p>}
          {child.pronouns && <p><strong>Pronouns:</strong> {child.pronouns}</p>}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={onCreateNew}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
        >
          Create New Wish Button Story
        </button>
        
        <button
          onClick={() => onShowPreviousStories(!showPreviousStories)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
        >
          {showPreviousStories ? 'Hide' : 'Show'} Previous Stories ({stories.length})
        </button>
      </div>

      {showPreviousStories && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Previous Stories</h2>
          
          {stories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No previous stories found for {child.name}.
            </div>
          ) : (
            <div className="grid gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {story.title || 'Untitled Story'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Created: {new Date(story.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        ID: {story.id.substring(0, 8)}...
                      </p>
                      {story.metadata?.storyVariables && (
                        <div className="text-sm text-gray-700">
                          <p><strong>Theme:</strong> {story.metadata.storyVariables.theme}</p>
                          <p><strong>Main Character:</strong> {story.metadata.storyVariables.mainCharacter}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onLoadStory(story)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Load Story
                      </button>
                      <button
                        onClick={() => handleDeleteStory(story.id, story.title || 'Untitled Story')}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
