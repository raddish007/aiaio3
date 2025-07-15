import { AssetType, Template, Personalization, SafeZone, AspectRatio } from './asset-types';

// Pagination
export const ASSETS_PER_PAGE = 50;

// File size limits (in bytes)
export const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 50 * 1024 * 1024, // 50MB
  video: 100 * 1024 * 1024, // 100MB
  prompt: 1024, // 1KB (text only)
} as const;

// Allowed file extensions by type
export const ALLOWED_FILE_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] as readonly string[],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'] as readonly string[],
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv'] as readonly string[],
  prompt: ['.txt', '.md'] as readonly string[],
} as const;

// MIME types by asset type
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] as readonly string[],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'] as readonly string[],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'] as readonly string[],
  prompt: ['text/plain', 'text/markdown'] as readonly string[],
} as const;

// Asset status options
export const ASSET_STATUSES = ['pending', 'approved', 'rejected'] as const;

// Asset type options
export const ASSET_TYPES = ['image', 'audio', 'video', 'prompt'] as const;

// Template options
export const TEMPLATES = ['lullaby', 'name-video', 'letter-hunt', 'general'] as const;

// Personalization options
export const PERSONALIZATION_OPTIONS = ['general', 'personalized'] as const;

// Safe zone options
export const SAFE_ZONE_OPTIONS = [
  'left_safe',
  'right_safe', 
  'center_safe',
  'intro_safe',
  'outro_safe',
  'all_ok',
  'not_applicable',
  'frame',
  'slideshow'
] as const;

// Image type options
export const IMAGE_TYPES = [
  'titleCard',
  'signImage',
  'bookImage',
  'groceryImage',
  'endingImage',
  'characterImage',
  'sceneImage'
] as const;

// Aspect ratio options
export const ASPECT_RATIOS = ['16:9', '9:16'] as const;

// Default form values
export const DEFAULT_UPLOAD_FORM = {
  theme: '',
  type: 'image' as AssetType,
  description: '',
  tags: '',
  project_id: '',
  prompt: '',
  personalization: 'general' as Personalization,
  child_name: '',
  template: '' as Template | '',
  volume: 1.0,
  audio_class: '',
  letter: '',
};

export const DEFAULT_REVIEW_FORM = {
  safe_zone: [] as SafeZone[],
  approval_notes: '',
  rejection_reason: '',
};

export const DEFAULT_EDIT_FORM = {
  title: '',
  theme: '',
  description: '',
  tags: '',
  prompt: '',
  personalization: 'general' as Personalization,
  child_name: '',
  template: '' as Template | '',
  volume: 1.0,
  audio_class: '',
  letter: '',
  imageType: '' as const,
  artStyle: '',
  aspectRatio: '16:9' as AspectRatio,
  ageRange: '',
  safeZone: 'center_safe' as SafeZone,
  targetLetter: '',
  additionalContext: '',
};

export const DEFAULT_BULK_UPLOAD_FORM = {
  description: '',
  tags: '',
  prompt: '',
  personalization: 'general' as Personalization,
  child_name: '',
  template: '' as Template | '',
  volume: 1.0,
  audio_class: '',
};

export const DEFAULT_FILTERS = {
  status: 'all' as const,
  type: 'all' as const,
  template: 'all' as const,
  search: '',
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_FILE_TYPE: 'Invalid file type for selected asset type',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  INVALID_VOLUME: 'Volume must be between 0 and 2',
  INVALID_SPEED: 'Speed must be between 0.5 and 2',
  NO_FILES_SELECTED: 'Please select at least one file',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  ASSETS: '/api/assets',
  UPLOAD: '/api/assets/upload',
  BULK_UPLOAD: '/api/assets/bulk-upload',
  APPROVE: (id: string) => `/api/assets/${id}/approve`,
  REJECT: (id: string) => `/api/assets/${id}/reject`,
  UPDATE: (id: string) => `/api/assets/${id}`,
  DELETE: (id: string) => `/api/assets/${id}`,
  GENERATE: (id: string) => `/api/assets/${id}/generate`,
  STATS: '/api/assets/stats',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MODAL_ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  APPROVE: 'a',
  REJECT: 'r',
  ESCAPE: 'Escape',
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
} as const;

// Type colors for UI
export const TYPE_COLORS = {
  image: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: '🖼️',
  },
  audio: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: '🎵',
  },
  video: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: '🎬',
  },
  prompt: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: '📝',
  },
} as const;
