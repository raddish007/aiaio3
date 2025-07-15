import { useState, useCallback } from 'react';
import { BulkUploadForm, AssetOperationResult, UploadProgress } from '@/lib/assets/asset-types';
import { DEFAULT_BULK_UPLOAD_FORM } from '@/lib/assets/asset-constants';
import { bulkUploadAssets } from '@/lib/assets/asset-api';
import { validateBulkUploadForm } from '@/lib/assets/asset-validation';
import { validateFiles } from '@/lib/assets/asset-utils';

export interface UseBulkUploadOptions {
  onSuccess?: (results: AssetOperationResult[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress[]) => void;
  onFileProgress?: (fileName: string, progress: UploadProgress) => void;
}

export interface UseBulkUploadReturn {
  // Form state
  form: BulkUploadForm;
  setForm: (form: BulkUploadForm) => void;
  updateForm: (updates: Partial<BulkUploadForm>) => void;
  resetForm: () => void;

  // Files state
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;

  // Upload state
  uploading: boolean;
  progress: UploadProgress[];
  totalProgress: number;
  completedUploads: number;
  failedUploads: number;
  error: string | null;

  // Drag and drop state
  dragActive: boolean;
  setDragActive: (active: boolean) => void;

  // Validation
  validationErrors: Array<{ field: string; message: string }>;
  fileValidationErrors: string[];
  isValid: boolean;

  // Actions
  upload: () => Promise<AssetOperationResult[]>;
  handleFilesDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  clearError: () => void;
  retryFailed: () => Promise<void>;
}

/**
 * Hook for managing bulk asset upload
 */
export function useBulkUpload(options: UseBulkUploadOptions = {}): UseBulkUploadReturn {
  const { 
    onSuccess, 
    onError, 
    onProgress,
    onFileProgress,
  } = options;

  // Form state
  const [form, setForm] = useState<BulkUploadForm>(DEFAULT_BULK_UPLOAD_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Validation
  const formValidation = validateBulkUploadForm(form, selectedFiles);
  const fileValidation = validateFiles(selectedFiles);

  // Derived state
  const totalProgress = progress.length > 0 
    ? progress.reduce((sum, p) => sum + p.progress, 0) / progress.length 
    : 0;
  
  const completedUploads = progress.filter(p => p.status === 'complete').length;
  const failedUploads = progress.filter(p => p.status === 'error').length;

  // Form management
  const updateForm = useCallback((updates: Partial<BulkUploadForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_BULK_UPLOAD_FORM);
    setSelectedFiles([]);
    setProgress([]);
    setError(null);
  }, []);

  // File management
  const addFiles = useCallback((newFiles: File[]) => {
    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueFiles = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...uniqueFiles];
    });
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setProgress(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setProgress([]);
    setError(null);
  }, []);

  // Drag and drop handlers
  const handleFilesDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

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
  const upload = useCallback(async (): Promise<AssetOperationResult[]> => {
    if (selectedFiles.length === 0 || !formValidation.isValid || !fileValidation.valid) {
      return [];
    }

    setUploading(true);
    setError(null);

    // Initialize progress for all files
    const initialProgress: UploadProgress[] = selectedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setProgress(initialProgress);
    onProgress?.(initialProgress);

    try {
      // Update progress as files are being uploaded
      const progressUpdatePromises = selectedFiles.map((file, index) => {
        return new Promise<void>((resolve) => {
          // Simulate incremental progress
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += Math.random() * 20;
            if (currentProgress >= 90) {
              clearInterval(interval);
              resolve();
              return;
            }

            setProgress(prev => {
              const updated = [...prev];
              if (updated[index]) {
                updated[index] = {
                  ...updated[index],
                  progress: Math.min(currentProgress, 90),
                };
                onFileProgress?.(file.name, updated[index]);
              }
              return updated;
            });
          }, 200);
        });
      });

      // Start progress simulation
      Promise.all(progressUpdatePromises);

      // Perform actual bulk upload
      const results = await bulkUploadAssets(selectedFiles, form);

      // Update final progress based on results
      const finalProgress: UploadProgress[] = selectedFiles.map((file, index) => {
        const result = results[index];
        return {
          fileName: file.name,
          progress: result?.success ? 100 : 0,
          status: result?.success ? 'complete' as const : 'error' as const,
          error: result?.success ? undefined : result?.error,
        };
      });

      setProgress(finalProgress);
      onProgress?.(finalProgress);

      const hasErrors = results.some(r => !r.success);
      if (hasErrors) {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => r.error)
          .join(', ');
        setError(`Some uploads failed: ${errorMessages}`);
        onError?.(errorMessages);
      } else {
        // All successful - reset form
        onSuccess?.(results);
        resetForm();
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk upload failed';
      
      // Update all progress to error state
      const errorProgress: UploadProgress[] = selectedFiles.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'error' as const,
        error: errorMessage,
      }));

      setProgress(errorProgress);
      onProgress?.(errorProgress);
      setError(errorMessage);
      onError?.(errorMessage);

      return selectedFiles.map(() => ({
        success: false,
        error: errorMessage,
      }));
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, form, formValidation.isValid, fileValidation.valid, onProgress, onFileProgress, onSuccess, onError, resetForm]);

  // Retry failed uploads
  const retryFailed = useCallback(async () => {
    const failedIndices = progress
      .map((p, index) => p.status === 'error' ? index : -1)
      .filter(index => index !== -1);

    if (failedIndices.length === 0) return;

    const failedFiles = failedIndices.map(index => selectedFiles[index]);
    
    setUploading(true);
    setError(null);

    try {
      const results = await bulkUploadAssets(failedFiles, form);
      
      // Update progress for retried files
      const updatedProgress = [...progress];
      failedIndices.forEach((originalIndex, resultIndex) => {
        const result = results[resultIndex];
        updatedProgress[originalIndex] = {
          fileName: failedFiles[resultIndex].name,
          progress: result?.success ? 100 : 0,
          status: result?.success ? 'complete' as const : 'error' as const,
          error: result?.success ? undefined : result?.error,
        };
      });

      setProgress(updatedProgress);
      onProgress?.(updatedProgress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [progress, selectedFiles, form, onProgress, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Form state
    form,
    setForm,
    updateForm,
    resetForm,

    // Files state
    selectedFiles,
    setSelectedFiles,
    addFiles,
    removeFile,
    clearFiles,

    // Upload state
    uploading,
    progress,
    totalProgress,
    completedUploads,
    failedUploads,
    error,

    // Drag and drop state
    dragActive,
    setDragActive,

    // Validation
    validationErrors: formValidation.errors,
    fileValidationErrors: fileValidation.errors,
    isValid: formValidation.isValid && fileValidation.valid,

    // Actions
    upload,
    handleFilesDrop,
    handleDragOver,
    handleDragLeave,
    clearError,
    retryFailed,
  };
}
