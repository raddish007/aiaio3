import { useState, useCallback } from 'react';
import { Asset, ReviewForm, EditForm, AssetOperationResult } from '@/lib/assets/asset-types';
import { DEFAULT_REVIEW_FORM } from '@/lib/assets/asset-constants';
import { 
  approveAsset, 
  rejectAsset, 
  approveAssetWithReview, 
  rejectAssetWithReview 
} from '@/lib/assets/asset-api';
import { validateReviewForm } from '@/lib/assets/asset-validation';
import { findNextPendingAsset } from '@/lib/assets/asset-utils';

export interface UseAssetReviewOptions {
  assets?: Asset[];
  onAssetReviewed?: (asset: Asset, result: AssetOperationResult) => void;
  onError?: (error: string) => void;
  autoAdvance?: boolean; // Automatically move to next asset after review
}

export interface UseAssetReviewReturn {
  // Review form state
  reviewForm: ReviewForm;
  setReviewForm: (form: ReviewForm) => void;
  updateReviewForm: (updates: Partial<ReviewForm>) => void;
  resetReviewForm: () => void;

  // Review state
  reviewing: boolean;
  error: string | null;

  // Validation
  validationErrors: Array<{ field: string; message: string }>;
  isValid: boolean;

  // Quick actions (simple approve/reject)
  approveQuick: (assetId: string) => Promise<AssetOperationResult>;
  rejectQuick: (assetId: string, reason?: string) => Promise<AssetOperationResult>;

  // Detailed review actions
  approveWithReview: (assetId: string, editData?: Partial<EditForm>) => Promise<AssetOperationResult>;
  rejectWithReview: (assetId: string) => Promise<AssetOperationResult>;

  // Navigation helpers
  getNextPendingAsset: (currentAssetId: string) => Asset | null;
  hasMorePendingAssets: (currentAssetId: string) => boolean;

  // Utility functions
  clearError: () => void;
}

/**
 * Hook for managing asset review workflow
 */
export function useAssetReview(options: UseAssetReviewOptions = {}): UseAssetReviewReturn {
  const { 
    assets = [],
    onAssetReviewed,
    onError,
    autoAdvance = false,
  } = options;

  // Review form state
  const [reviewForm, setReviewForm] = useState<ReviewForm>(DEFAULT_REVIEW_FORM);
  
  // Review state
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const validation = validateReviewForm(reviewForm);

  // Form management
  const updateReviewForm = useCallback((updates: Partial<ReviewForm>) => {
    setReviewForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetReviewForm = useCallback(() => {
    setReviewForm(DEFAULT_REVIEW_FORM);
    setError(null);
  }, []);

  // Quick approve (simple)
  const approveQuick = useCallback(async (assetId: string): Promise<AssetOperationResult> => {
    setReviewing(true);
    setError(null);

    try {
      const result = await approveAsset(assetId);
      
      if (result.success && result.asset) {
        onAssetReviewed?.(result.asset, result);
        
        if (autoAdvance) {
          const nextAsset = findNextPendingAsset(assets, assetId);
          if (!nextAsset) {
            resetReviewForm();
          }
        }
      } else {
        setError(result.error || 'Failed to approve asset');
        onError?.(result.error || 'Failed to approve asset');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve asset';
      setError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setReviewing(false);
    }
  }, [assets, onAssetReviewed, onError, autoAdvance, resetReviewForm]);

  // Quick reject (simple)
  const rejectQuick = useCallback(async (assetId: string, reason?: string): Promise<AssetOperationResult> => {
    setReviewing(true);
    setError(null);

    try {
      const result = await rejectAsset(assetId, reason);
      
      if (result.success && result.asset) {
        onAssetReviewed?.(result.asset, result);
        
        if (autoAdvance) {
          const nextAsset = findNextPendingAsset(assets, assetId);
          if (!nextAsset) {
            resetReviewForm();
          }
        }
      } else {
        setError(result.error || 'Failed to reject asset');
        onError?.(result.error || 'Failed to reject asset');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject asset';
      setError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setReviewing(false);
    }
  }, [assets, onAssetReviewed, onError, autoAdvance, resetReviewForm]);

  // Approve with detailed review
  const approveWithReview = useCallback(async (
    assetId: string, 
    editData?: Partial<EditForm>
  ): Promise<AssetOperationResult> => {
    if (!validation.isValid) {
      const errorMessage = 'Please complete the review form';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    setReviewing(true);
    setError(null);

    try {
      const result = await approveAssetWithReview(assetId, reviewForm, editData);
      
      if (result.success && result.asset) {
        onAssetReviewed?.(result.asset, result);
        resetReviewForm();
        
        if (autoAdvance) {
          const nextAsset = findNextPendingAsset(assets, assetId);
          if (!nextAsset) {
            // No more pending assets
          }
        }
      } else {
        setError(result.error || 'Failed to approve asset with review');
        onError?.(result.error || 'Failed to approve asset with review');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve asset with review';
      setError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setReviewing(false);
    }
  }, [validation.isValid, reviewForm, onAssetReviewed, onError, autoAdvance, assets, resetReviewForm]);

  // Reject with detailed review
  const rejectWithReview = useCallback(async (assetId: string): Promise<AssetOperationResult> => {
    if (!reviewForm.rejection_reason.trim()) {
      const errorMessage = 'Please provide a rejection reason';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    setReviewing(true);
    setError(null);

    try {
      const result = await rejectAssetWithReview(assetId, reviewForm);
      
      if (result.success && result.asset) {
        onAssetReviewed?.(result.asset, result);
        resetReviewForm();
        
        if (autoAdvance) {
          const nextAsset = findNextPendingAsset(assets, assetId);
          if (!nextAsset) {
            // No more pending assets
          }
        }
      } else {
        setError(result.error || 'Failed to reject asset with review');
        onError?.(result.error || 'Failed to reject asset with review');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject asset with review';
      setError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setReviewing(false);
    }
  }, [reviewForm, onAssetReviewed, onError, autoAdvance, assets, resetReviewForm]);

  // Navigation helpers
  const getNextPendingAsset = useCallback((currentAssetId: string): Asset | null => {
    return findNextPendingAsset(assets, currentAssetId);
  }, [assets]);

  const hasMorePendingAssets = useCallback((currentAssetId: string): boolean => {
    return getNextPendingAsset(currentAssetId) !== null;
  }, [getNextPendingAsset]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Review form state
    reviewForm,
    setReviewForm,
    updateReviewForm,
    resetReviewForm,

    // Review state
    reviewing,
    error,

    // Validation
    validationErrors: validation.errors,
    isValid: validation.isValid,

    // Quick actions
    approveQuick,
    rejectQuick,

    // Detailed review actions
    approveWithReview,
    rejectWithReview,

    // Navigation helpers
    getNextPendingAsset,
    hasMorePendingAssets,

    // Utility functions
    clearError,
  };
}

/**
 * Hook for batch review operations
 */
export function useBatchReview(assets: Asset[] = []) {
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  const toggleAssetSelection = useCallback((assetId: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((filter?: (asset: Asset) => boolean) => {
    const assetsToSelect = filter ? assets.filter(filter) : assets;
    setSelectedAssetIds(new Set(assetsToSelect.map(asset => asset.id)));
  }, [assets]);

  const clearSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
  }, []);

  const batchApprove = useCallback(async (): Promise<AssetOperationResult[]> => {
    if (selectedAssetIds.size === 0) return [];

    setBatchProcessing(true);
    const results: AssetOperationResult[] = [];

    try {
      const assetIdsArray = Array.from(selectedAssetIds);
      for (const assetId of assetIdsArray) {
        const result = await approveAsset(assetId);
        results.push(result);
      }

      // Clear selection if all successful
      if (results.every(r => r.success)) {
        clearSelection();
      }
    } catch (err) {
      console.error('Batch approve failed:', err);
    } finally {
      setBatchProcessing(false);
    }

    return results;
  }, [selectedAssetIds, clearSelection]);

  const batchReject = useCallback(async (reason: string): Promise<AssetOperationResult[]> => {
    if (selectedAssetIds.size === 0) return [];

    setBatchProcessing(true);
    const results: AssetOperationResult[] = [];

    try {
      const assetIdsArray = Array.from(selectedAssetIds);
      for (const assetId of assetIdsArray) {
        const result = await rejectAsset(assetId, reason);
        results.push(result);
      }

      // Clear selection if all successful
      if (results.every(r => r.success)) {
        clearSelection();
      }
    } catch (err) {
      console.error('Batch reject failed:', err);
    } finally {
      setBatchProcessing(false);
    }

    return results;
  }, [selectedAssetIds, clearSelection]);

  return {
    selectedAssetIds,
    selectedCount: selectedAssetIds.size,
    batchProcessing,
    toggleAssetSelection,
    selectAll,
    clearSelection,
    batchApprove,
    batchReject,
  };
}
