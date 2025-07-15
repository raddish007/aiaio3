import { useState, useCallback, useEffect } from 'react';
import { Asset, EditForm } from '@/lib/assets/asset-types';
import { DEFAULT_EDIT_FORM } from '@/lib/assets/asset-constants';
import { findNextAsset, findPreviousAsset } from '@/lib/assets/asset-utils';
import { handleKeyboardShortcuts, KeyboardShortcutHandlers } from '@/lib/assets/asset-utils';

export interface UseAssetModalOptions {
  assets?: Asset[];
  onAssetChange?: (asset: Asset | null) => void;
  enableKeyboardShortcuts?: boolean;
}

export interface UseAssetModalReturn {
  // Modal state
  isOpen: boolean;
  selectedAsset: Asset | null;
  
  // Modal management
  openModal: (asset: Asset) => void;
  closeModal: () => void;
  
  // Navigation
  goToNextAsset: () => void;
  goToPreviousAsset: () => void;
  hasNextAsset: boolean;
  hasPreviousAsset: boolean;
  
  // Edit form state
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  updateEditForm: (updates: Partial<EditForm>) => void;
  resetEditForm: () => void;
  initializeEditForm: (asset: Asset) => void;
  
  // Modal state helpers
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  
  // Keyboard shortcuts
  handleKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Hook for managing asset detail modal
 */
export function useAssetModal(options: UseAssetModalOptions = {}): UseAssetModalReturn {
  const { 
    assets = [],
    onAssetChange,
    enableKeyboardShortcuts = true,
  } = options;

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM);

  // Navigation helpers
  const hasNextAsset = selectedAsset ? findNextAsset(assets, selectedAsset.id) !== null : false;
  const hasPreviousAsset = selectedAsset ? findPreviousAsset(assets, selectedAsset.id) !== null : false;

  // Modal management
  const openModal = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setIsOpen(true);
    setIsEditing(false);
    onAssetChange?.(asset);
    
    // Initialize edit form with asset data
    initializeEditForm(asset);
    
    // Auto-scroll to top when modal opens
    setTimeout(() => {
      const modal = document.querySelector('.modal-content');
      if (modal) {
        modal.scrollTop = 0;
      }
    }, 100);
  }, [onAssetChange]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedAsset(null);
    setIsEditing(false);
    resetEditForm();
    onAssetChange?.(null);
  }, [onAssetChange]);

  // Navigation
  const goToNextAsset = useCallback(() => {
    if (!selectedAsset) return;
    
    const nextAsset = findNextAsset(assets, selectedAsset.id);
    if (nextAsset) {
      setSelectedAsset(nextAsset);
      setIsEditing(false);
      initializeEditForm(nextAsset);
      onAssetChange?.(nextAsset);
      
      // Scroll to top of modal
      setTimeout(() => {
        const modal = document.querySelector('.modal-content');
        if (modal) {
          modal.scrollTop = 0;
        }
      }, 100);
    }
  }, [selectedAsset, assets, onAssetChange]);

  const goToPreviousAsset = useCallback(() => {
    if (!selectedAsset) return;
    
    const previousAsset = findPreviousAsset(assets, selectedAsset.id);
    if (previousAsset) {
      setSelectedAsset(previousAsset);
      setIsEditing(false);
      initializeEditForm(previousAsset);
      onAssetChange?.(previousAsset);
      
      // Scroll to top of modal
      setTimeout(() => {
        const modal = document.querySelector('.modal-content');
        if (modal) {
          modal.scrollTop = 0;
        }
      }, 100);
    }
  }, [selectedAsset, assets, onAssetChange]);

  // Edit form management
  const updateEditForm = useCallback((updates: Partial<EditForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetEditForm = useCallback(() => {
    setEditForm(DEFAULT_EDIT_FORM);
  }, []);

  const initializeEditForm = useCallback((asset: Asset) => {
    setEditForm({
      title: asset.title || '',
      theme: asset.theme || '',
      description: asset.metadata?.description || '',
      tags: asset.tags ? asset.tags.join(', ') : '',
      prompt: asset.metadata?.prompt || asset.prompt || '',
      personalization: asset.metadata?.personalization || 'general',
      child_name: asset.metadata?.child_name || '',
      template: asset.metadata?.template || '',
      volume: asset.metadata?.volume || 1.0,
      audio_class: asset.metadata?.audio_class || '',
      letter: asset.metadata?.letter || '',
      imageType: asset.metadata?.imageType || '',
      artStyle: asset.metadata?.artStyle || '',
      aspectRatio: asset.metadata?.aspectRatio || '16:9',
      ageRange: asset.metadata?.ageRange || '',
      safeZone: asset.metadata?.safeZone || 'center_safe',
      targetLetter: asset.metadata?.targetLetter || '',
      additionalContext: asset.metadata?.additionalContext || '',
    });
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardShortcuts || !isOpen) return;

    const handlers: KeyboardShortcutHandlers = {
      onNext: goToNextAsset,
      onPrevious: goToPreviousAsset,
      onEscape: closeModal,
    };

    handleKeyboardShortcuts(event, handlers, isOpen);
  }, [enableKeyboardShortcuts, isOpen, goToNextAsset, goToPreviousAsset, closeModal]);

  // Setup keyboard event listeners
  useEffect(() => {
    if (enableKeyboardShortcuts && isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enableKeyboardShortcuts, isOpen, handleKeyDown]);

  // Update edit form when selected asset changes
  useEffect(() => {
    if (selectedAsset) {
      initializeEditForm(selectedAsset);
    }
  }, [selectedAsset, initializeEditForm]);

  return {
    // Modal state
    isOpen,
    selectedAsset,
    
    // Modal management
    openModal,
    closeModal,
    
    // Navigation
    goToNextAsset,
    goToPreviousAsset,
    hasNextAsset,
    hasPreviousAsset,
    
    // Edit form state
    editForm,
    setEditForm,
    updateEditForm,
    resetEditForm,
    initializeEditForm,
    
    // Modal state helpers
    isEditing,
    setIsEditing,
    
    // Keyboard shortcuts
    handleKeyDown,
  };
}

/**
 * Hook for managing multiple modal states (upload, bulk upload, etc.)
 */
export function useModalStates() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const closeAllModals = useCallback(() => {
    setUploadModalOpen(false);
    setBulkUploadModalOpen(false);
    setDetailModalOpen(false);
  }, []);

  const openUploadModal = useCallback(() => {
    closeAllModals();
    setUploadModalOpen(true);
  }, [closeAllModals]);

  const openBulkUploadModal = useCallback(() => {
    closeAllModals();
    setBulkUploadModalOpen(true);
  }, [closeAllModals]);

  const openDetailModal = useCallback(() => {
    setDetailModalOpen(true);
  }, []);

  return {
    // Modal states
    uploadModalOpen,
    bulkUploadModalOpen,
    detailModalOpen,
    
    // Modal controls
    setUploadModalOpen,
    setBulkUploadModalOpen,
    setDetailModalOpen,
    
    // Utility functions
    closeAllModals,
    openUploadModal,
    openBulkUploadModal,
    openDetailModal,
    
    // Computed state
    anyModalOpen: uploadModalOpen || bulkUploadModalOpen || detailModalOpen,
  };
}
