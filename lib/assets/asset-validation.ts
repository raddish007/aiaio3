import { 
  UploadForm, 
  EditForm, 
  ReviewForm, 
  BulkUploadForm,
  AssetType 
} from './asset-types';
import { 
  VALIDATION_MESSAGES,
  TEMPLATES,
  PERSONALIZATION_OPTIONS,
  SAFE_ZONE_OPTIONS,
  IMAGE_TYPES,
  ASPECT_RATIOS,
  MAX_FILE_SIZE
} from './asset-constants';
import { validateFileType, validateFileSize } from './asset-utils';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate upload form
 */
export function validateUploadForm(form: UploadForm, file?: File): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!form.theme.trim()) {
    errors.push({ field: 'theme', message: VALIDATION_MESSAGES.REQUIRED_FIELD });
  }

  if (form.theme.length > 255) {
    errors.push({ field: 'theme', message: VALIDATION_MESSAGES.MAX_LENGTH(255) });
  }

  // Type validation
  if (!['image', 'audio', 'video', 'prompt'].includes(form.type)) {
    errors.push({ field: 'type', message: 'Invalid asset type' });
  }

  // Description validation
  if (form.description && form.description.length > 1000) {
    errors.push({ field: 'description', message: VALIDATION_MESSAGES.MAX_LENGTH(1000) });
  }

  // Prompt validation
  if (form.prompt && form.prompt.length > 2000) {
    errors.push({ field: 'prompt', message: VALIDATION_MESSAGES.MAX_LENGTH(2000) });
  }

  // Personalization validation
  if (!PERSONALIZATION_OPTIONS.includes(form.personalization)) {
    errors.push({ field: 'personalization', message: 'Invalid personalization option' });
  }

  // Child name required for personalized assets
  if (form.personalization === 'personalized' && !form.child_name.trim()) {
    errors.push({ field: 'child_name', message: 'Child name is required for personalized assets' });
  }

  // Template validation
  if (form.template && !TEMPLATES.includes(form.template as any)) {
    errors.push({ field: 'template', message: 'Invalid template' });
  }

  // Volume validation
  if (form.volume < 0 || form.volume > 2) {
    errors.push({ field: 'volume', message: VALIDATION_MESSAGES.INVALID_VOLUME });
  }

  // File validation
  if (file) {
    if (!validateFileType(file, form.type)) {
      errors.push({ field: 'file', message: VALIDATION_MESSAGES.INVALID_FILE_TYPE });
    }

    if (!validateFileSize(file, form.type)) {
      const maxSizeMB = (MAX_FILE_SIZE[form.type] / (1024 * 1024)).toFixed(1);
      errors.push({ 
        field: 'file', 
        message: `File size exceeds ${maxSizeMB}MB limit` 
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate edit form
 */
export function validateEditForm(form: EditForm): ValidationResult {
  const errors: ValidationError[] = [];

  // Theme validation
  if (!form.theme.trim()) {
    errors.push({ field: 'theme', message: VALIDATION_MESSAGES.REQUIRED_FIELD });
  }

  if (form.theme.length > 255) {
    errors.push({ field: 'theme', message: VALIDATION_MESSAGES.MAX_LENGTH(255) });
  }

  // Description validation
  if (form.description && form.description.length > 1000) {
    errors.push({ field: 'description', message: VALIDATION_MESSAGES.MAX_LENGTH(1000) });
  }

  // Prompt validation
  if (form.prompt && form.prompt.length > 2000) {
    errors.push({ field: 'prompt', message: VALIDATION_MESSAGES.MAX_LENGTH(2000) });
  }

  // Personalization validation
  if (!PERSONALIZATION_OPTIONS.includes(form.personalization)) {
    errors.push({ field: 'personalization', message: 'Invalid personalization option' });
  }

  // Child name required for personalized assets
  if (form.personalization === 'personalized' && !form.child_name.trim()) {
    errors.push({ field: 'child_name', message: 'Child name is required for personalized assets' });
  }

  // Template validation
  if (form.template && !TEMPLATES.includes(form.template as any)) {
    errors.push({ field: 'template', message: 'Invalid template' });
  }

  // Volume validation
  if (form.volume < 0 || form.volume > 2) {
    errors.push({ field: 'volume', message: VALIDATION_MESSAGES.INVALID_VOLUME });
  }

  // Image type validation
  if (form.imageType && !IMAGE_TYPES.includes(form.imageType as any)) {
    errors.push({ field: 'imageType', message: 'Invalid image type' });
  }

  // Aspect ratio validation
  if (form.aspectRatio && !ASPECT_RATIOS.includes(form.aspectRatio)) {
    errors.push({ field: 'aspectRatio', message: 'Invalid aspect ratio' });
  }

  // Safe zone validation
  if (form.safeZone && !SAFE_ZONE_OPTIONS.includes(form.safeZone)) {
    errors.push({ field: 'safeZone', message: 'Invalid safe zone' });
  }

  // Age range validation
  if (form.ageRange && form.ageRange.length > 50) {
    errors.push({ field: 'ageRange', message: VALIDATION_MESSAGES.MAX_LENGTH(50) });
  }

  // Art style validation
  if (form.artStyle && form.artStyle.length > 100) {
    errors.push({ field: 'artStyle', message: VALIDATION_MESSAGES.MAX_LENGTH(100) });
  }

  // Additional context validation
  if (form.additionalContext && form.additionalContext.length > 500) {
    errors.push({ field: 'additionalContext', message: VALIDATION_MESSAGES.MAX_LENGTH(500) });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate review form
 */
export function validateReviewForm(form: ReviewForm): ValidationResult {
  const errors: ValidationError[] = [];

  // Safe zone validation
  if (form.safe_zone.length === 0) {
    errors.push({ field: 'safe_zone', message: 'At least one safe zone must be selected' });
  }

  // Validate each safe zone option
  form.safe_zone.forEach((zone, index) => {
    if (!SAFE_ZONE_OPTIONS.includes(zone)) {
      errors.push({ field: `safe_zone[${index}]`, message: 'Invalid safe zone option' });
    }
  });

  // Approval notes validation
  if (form.approval_notes && form.approval_notes.length > 500) {
    errors.push({ field: 'approval_notes', message: VALIDATION_MESSAGES.MAX_LENGTH(500) });
  }

  // Rejection reason validation
  if (form.rejection_reason && form.rejection_reason.length > 500) {
    errors.push({ field: 'rejection_reason', message: VALIDATION_MESSAGES.MAX_LENGTH(500) });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate bulk upload form
 */
export function validateBulkUploadForm(form: BulkUploadForm, files: File[] = []): ValidationResult {
  const errors: ValidationError[] = [];

  // Files validation
  if (files.length === 0) {
    errors.push({ field: 'files', message: VALIDATION_MESSAGES.NO_FILES_SELECTED });
  }

  // Description validation
  if (form.description && form.description.length > 1000) {
    errors.push({ field: 'description', message: VALIDATION_MESSAGES.MAX_LENGTH(1000) });
  }

  // Prompt validation
  if (form.prompt && form.prompt.length > 2000) {
    errors.push({ field: 'prompt', message: VALIDATION_MESSAGES.MAX_LENGTH(2000) });
  }

  // Personalization validation
  if (!PERSONALIZATION_OPTIONS.includes(form.personalization)) {
    errors.push({ field: 'personalization', message: 'Invalid personalization option' });
  }

  // Child name required for personalized assets
  if (form.personalization === 'personalized' && !form.child_name.trim()) {
    errors.push({ field: 'child_name', message: 'Child name is required for personalized assets' });
  }

  // Template validation
  if (form.template && !TEMPLATES.includes(form.template as any)) {
    errors.push({ field: 'template', message: 'Invalid template' });
  }

  // Volume validation
  if (form.volume < 0 || form.volume > 2) {
    errors.push({ field: 'volume', message: VALIDATION_MESSAGES.INVALID_VOLUME });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: string | null | undefined): boolean {
  return Boolean(value && value.toString().trim().length > 0);
}

/**
 * Validate string length
 */
export function validateLength(
  value: string, 
  min?: number, 
  max?: number
): ValidationError | null {
  if (min !== undefined && value.length < min) {
    return { field: 'length', message: VALIDATION_MESSAGES.MIN_LENGTH(min) };
  }
  
  if (max !== undefined && value.length > max) {
    return { field: 'length', message: VALIDATION_MESSAGES.MAX_LENGTH(max) };
  }
  
  return null;
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number, 
  min: number, 
  max: number, 
  fieldName: string = 'value'
): ValidationError | null {
  if (value < min || value > max) {
    return { 
      field: fieldName, 
      message: `${fieldName} must be between ${min} and ${max}` 
    };
  }
  
  return null;
}

/**
 * Get validation error message for a specific field
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | null {
  const error = errors.find(err => err.field === fieldName);
  return error ? error.message : null;
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return errors.map(err => `${err.field}: ${err.message}`).join(', ');
}
