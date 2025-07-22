import { useState, useEffect, useCallback } from 'react';
import { Child, ContentProject } from '@/types/wish-button';
import { WishButtonService } from '@/services/wish-button/WishButtonService';

export const useWishButtonData = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [previousStories, setPreviousStories] = useState<ContentProject[]>([]);
  const [currentStoryProject, setCurrentStoryProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreviousStories, setShowPreviousStories] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      const data = await WishButtonService.fetchChildren();
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreviousStories = useCallback(async (child: Child, forceRefresh = false) => {
    try {
      const data = await WishButtonService.fetchPreviousStories(child, forceRefresh);
      setPreviousStories(data);
    } catch (error) {
      console.error('Error fetching previous stories:', error);
      setPreviousStories([]);
    }
  }, []);

  const deleteStory = useCallback(async (storyId: string) => {
    try {
      await WishButtonService.deleteStory(storyId);
      // Refresh the stories list if we have a selected child
      if (selectedChild) {
        await fetchPreviousStories(selectedChild, true);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }, [selectedChild, fetchPreviousStories]);

  const handleChildSelect = useCallback((child: Child) => {
    setSelectedChild(child);
    fetchPreviousStories(child, false);
  }, [fetchPreviousStories]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return {
    children,
    selectedChild,
    previousStories,
    currentStoryProject,
    loading,
    showPreviousStories,
    setSelectedChild,
    setCurrentStoryProject,
    setShowPreviousStories,
    handleChildSelect,
    fetchPreviousStories,
    deleteStory,
    refreshChildren: fetchChildren
  };
};
