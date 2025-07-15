import { AssetType, AssetFilters, Asset } from './asset-types';
import { 
  ALLOWED_FILE_EXTENSIONS, 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE,
  ASSETS_PER_PAGE 
} from './asset-constants';

/**
 * Detect asset type from file extension
 */
export function detectAssetType(fileName: string): AssetType {
  const extension = fileName.toLowerCase().split('.').pop();
  
  if (!extension) return 'image';
  
  const ext = `.${extension}`;
  
  if ((ALLOWED_FILE_EXTENSIONS.image as readonly string[]).includes(ext)) return 'image';
  if ((ALLOWED_FILE_EXTENSIONS.audio as readonly string[]).includes(ext)) return 'audio';
  if ((ALLOWED_FILE_EXTENSIONS.video as readonly string[]).includes(ext)) return 'video';
  if ((ALLOWED_FILE_EXTENSIONS.prompt as readonly string[]).includes(ext)) return 'prompt';
  
  return 'image'; // Default fallback
}

/**
 * Validate file type matches the selected asset type
 */
export function validateFileType(file: File, assetType: AssetType): boolean {
  const allowedMimeTypes = ALLOWED_MIME_TYPES[assetType] as readonly string[];
  const allowedExtensions = ALLOWED_FILE_EXTENSIONS[assetType] as readonly string[];
  
  // Check MIME type
  if (allowedMimeTypes.includes(file.type)) {
    return true;
  }
  
  // Fallback to extension check
  const extension = `.${file.name.toLowerCase().split('.').pop()}`;
  return allowedExtensions.includes(extension);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, assetType: AssetType): boolean {
  const maxSize = MAX_FILE_SIZE[assetType];
  return file.size <= maxSize;
}

/**
 * Validate multiple files for bulk upload
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFiles(files: File[]): FileValidationResult {
  const errors: string[] = [];
  
  if (files.length === 0) {
    errors.push('No files selected');
    return { valid: false, errors };
  }
  
  files.forEach((file, index) => {
    const assetType = detectAssetType(file.name);
    
    // Validate file type
    if (!validateFileType(file, assetType)) {
      errors.push(`File ${index + 1} (${file.name}): Invalid file type for detected asset type "${assetType}"`);
    }
    
    // Validate file size
    if (!validateFileSize(file, assetType)) {
      const maxSizeMB = (MAX_FILE_SIZE[assetType] / (1024 * 1024)).toFixed(1);
      errors.push(`File ${index + 1} (${file.name}): File size exceeds ${maxSizeMB}MB limit`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract metadata from file (basic implementation)
 */
export function extractFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
    extension: file.name.split('.').pop()?.toLowerCase(),
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for display (in seconds to mm:ss or hh:mm:ss)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if asset type is audio or video (for media player)
 */
export function isMediaAsset(type: AssetType): boolean {
  return ['audio', 'video'].includes(type);
}

/**
 * Generate search query for multiple fields
 */
export function buildSearchQuery(searchTerm: string): string {
  if (!searchTerm.trim()) return '';
  
  const term = searchTerm.trim();
  return `theme.ilike.%${term}%,prompt.ilike.%${term}%,metadata->description.ilike.%${term}%,metadata->child_name.ilike.%${term}%,metadata->prompt.ilike.%${term}%,metadata->audio_class.ilike.%${term}%,metadata->letter.ilike.%${term}%`;
}

/**
 * Filter assets locally (for client-side filtering)
 */
export function filterAssets(assets: Asset[], filters: AssetFilters): Asset[] {
  return assets.filter(asset => {
    // Status filter
    if (filters.status !== 'all' && asset.status !== filters.status) {
      return false;
    }
    
    // Type filter
    if (filters.type !== 'all' && asset.type !== filters.type) {
      return false;
    }
    
    // Template filter
    if (filters.template !== 'all' && asset.metadata?.template !== filters.template) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        asset.theme,
        asset.prompt,
        asset.metadata?.description,
        asset.metadata?.child_name,
        asset.metadata?.prompt,
        asset.metadata?.audio_class,
        asset.metadata?.letter,
        ...(asset.tags || []),
      ];
      
      const matches = searchableFields.some(field => 
        field && field.toLowerCase().includes(searchTerm)
      );
      
      if (!matches) return false;
    }
    
    return true;
  });
}

/**
 * Calculate pagination info
 */
export function calculatePagination(
  totalItems: number, 
  currentPage: number, 
  itemsPerPage: number = ASSETS_PER_PAGE
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Find next asset in a list (for modal navigation)
 */
export function findNextAsset(assets: Asset[], currentAssetId: string): Asset | null {
  const currentIndex = assets.findIndex(asset => asset.id === currentAssetId);
  if (currentIndex === -1 || currentIndex === assets.length - 1) {
    return null;
  }
  return assets[currentIndex + 1];
}

/**
 * Find previous asset in a list (for modal navigation)
 */
export function findPreviousAsset(assets: Asset[], currentAssetId: string): Asset | null {
  const currentIndex = assets.findIndex(asset => asset.id === currentAssetId);
  if (currentIndex <= 0) {
    return null;
  }
  return assets[currentIndex - 1];
}

/**
 * Find next pending asset for review workflow
 */
export function findNextPendingAsset(assets: Asset[], currentAssetId: string): Asset | null {
  const pendingAssets = assets.filter(asset => asset.status === 'pending');
  return findNextAsset(pendingAssets, currentAssetId);
}

/**
 * Generate asset preview URL (for thumbnails)
 */
export function generateAssetPreviewUrl(asset: Asset): string | null {
  if (!asset.file_url) return null;
  
  // For images, return the file URL directly
  if (asset.type === 'image') {
    return asset.file_url;
  }
  
  // For audio/video, you might want to generate thumbnail URLs
  // This is a placeholder - implement based on your storage setup
  return null;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Handle keyboard shortcuts
 */
export interface KeyboardShortcutHandlers {
  onApprove?: () => void;
  onReject?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEscape?: () => void;
}

export function handleKeyboardShortcuts(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers,
  isModalOpen: boolean = false
) {
  // Prevent shortcuts when typing in input fields
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return;
  }
  
  if (!isModalOpen) return;
  
  switch (event.key) {
    case 'a':
    case 'A':
      event.preventDefault();
      handlers.onApprove?.();
      break;
    case 'r':
    case 'R':
      event.preventDefault();
      handlers.onReject?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      handlers.onNext?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      handlers.onPrevious?.();
      break;
    case 'Escape':
      event.preventDefault();
      handlers.onEscape?.();
      break;
  }
}

/**
 * Parse tags string into array
 */
export function parseTags(tagsString: string): string[] {
  if (!tagsString.trim()) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

/**
 * Join tags array into string
 */
export function joinTags(tags: string[]): string {
  return tags.filter(tag => tag.trim().length > 0).join(', ');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate random ID (fallback utility)
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Deep clone object (for form state management)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get icon type for asset type (returns string identifier)
 */
export function getAssetTypeIcon(type: AssetType): string {
  switch (type) {
    case 'image':
      return 'image';
    case 'audio':
      return 'audio';
    case 'video':
      return 'video';
    case 'prompt':
      return 'prompt';
    default:
      return 'file';
  }
}
