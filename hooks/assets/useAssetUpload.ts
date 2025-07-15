import { useState, useCallback } from 'react';
import { UploadForm, AssetOperationResult, UploadProgress } from '@/lib/assets/asset-types';
import { DEFAULT_UPLOAD_FORM } from '@/lib/assets/asset-constants';
import { uploadAsset } from '@/lib/assets/asset-api';
import { validateUploadForm } from '@/lib/assets/asset-validation';
import { detectAssetType } from '@/lib/assets/asset-utils';

export interface UseAssetUploadOptions {
  onSuccess?: (result: AssetOperationResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
  autoDetectType?: boolean;
}

export interface UseAssetUploadReturn {
  // Form state
  form: UploadForm;
  setForm: (form: UploadForm) => void;
  updateForm: (updates: Partial<UploadForm>) => void;
  resetForm: () => void;

  // File state
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // Upload state
  uploading: boolean;
  progress: UploadProgress | null;
  error: string | null;

  // Drag and drop state
  dragActive: boolean;
  setDragActive: (active: boolean) => void;

  // Validation
  validationErrors: Array<{ field: string; message: string }>;
  isValid: boolean;

  // Actions
  upload: () => Promise<AssetOperationResult | null>;
  handleFileSelect: (file: File) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  clearError: () => void;
}

/**
 * Hook for managing single asset upload
 */
export function useAssetUpload(options: UseAssetUploadOptions = {}): UseAssetUploadReturn {
  const { 
    onSuccess, 
    onError, 
    onProgress, 
    autoDetectType = true 
  } = options;

  // Form state
  const [form, setForm] = useState<UploadForm>(DEFAULT_UPLOAD_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Validation
  const validation = validateUploadForm(form, selectedFile || undefined);

  // Form management
  const updateForm = useCallback((updates: Partial<UploadForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_UPLOAD_FORM);
    setSelectedFile(null);
    setError(null);
    setProgress(null);
  }, []);

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);

    // Auto-detect asset type
    if (autoDetectType) {
      const detectedType = detectAssetType(file.name);
      updateForm({ type: detectedType });
    }

    // Auto-populate theme from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    if (!form.theme.trim()) {
      updateForm({ theme: fileName });
    }
  }, [autoDetectType, form.theme, updateForm]);

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  // Upload function
  const upload = useCallback(async (): Promise<AssetOperationResult | null> => {
    if (!selectedFile || !validation.isValid) {
      return null;
    }

    setUploading(true);
    setError(null);

    // Set initial progress
    const initialProgress: UploadProgress = {
      fileName: selectedFile.name,
      progress: 0,
      status: 'uploading',
    };
    setProgress(initialProgress);
    onProgress?.(initialProgress);

    try {
      // Simulate progress updates
      const progressUpdates = [10, 25, 50, 75, 90];
      for (const prog of progressUpdates) {
        const updateProgress: UploadProgress = {
          fileName: selectedFile.name,
          progress: prog,
          status: 'uploading',
        };
        setProgress(updateProgress);
        onProgress?.(updateProgress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Perform actual upload
      const result = await uploadAsset(selectedFile, form);

      if (result.success) {
        // Complete progress
        const completeProgress: UploadProgress = {
          fileName: selectedFile.name,
          progress: 100,
          status: 'complete',
        };
        setProgress(completeProgress);
        onProgress?.(completeProgress);

        onSuccess?.(result);
        resetForm();
        return result;
      } else {
        // Error progress
        const errorProgress: UploadProgress = {
          fileName: selectedFile.name,
          progress: 0,
          status: 'error',
          error: result.error,
        };
        setProgress(errorProgress);
        onProgress?.(errorProgress);

        setError(result.error || 'Upload failed');
        onError?.(result.error || 'Upload failed');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      
      // Error progress
      const errorProgress: UploadProgress = {
        fileName: selectedFile.name,
        progress: 0,
        status: 'error',
        error: errorMessage,
      };
      setProgress(errorProgress);
      onProgress?.(errorProgress);

      setError(errorMessage);
      onError?.(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  }, [selectedFile, form, validation.isValid, onProgress, onSuccess, onError, resetForm]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setProgress(null);
  }, []);

  return {
    // Form state
    form,
    setForm,
    updateForm,
    resetForm,

    // File state
    selectedFile,
    setSelectedFile,

    // Upload state
    uploading,
    progress,
    error,

    // Drag and drop state
    dragActive,
    setDragActive,

    // Validation
    validationErrors: validation.errors,
    isValid: validation.isValid,

    // Actions
    upload,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearError,
  };
}
