// Asset domain types extracted from the original assets.tsx file

export type AssetStatus = 'pending' | 'approved' | 'rejected';

export type AssetType = 'image' | 'audio' | 'video' | 'prompt';

export type Template = 'lullaby' | 'name-video' | 'letter-hunt' | 'general';

export type Personalization = 'general' | 'personalized';

export type SafeZone = 
  | 'left_safe' 
  | 'right_safe' 
  | 'center_safe' 
  | 'intro_safe' 
  | 'outro_safe' 
  | 'all_ok' 
  | 'not_applicable'
  | 'frame'
  | 'slideshow';

export type ImageType = 
  | 'titleCard' 
  | 'signImage' 
  | 'bookImage' 
  | 'groceryImage' 
  | 'endingImage' 
  | 'characterImage' 
  | 'sceneImage';

export type AspectRatio = '16:9' | '9:16';

export interface AssetMetadata {
  title?: string;
  description?: string;
  project_id?: string;
  prompt?: string;
  personalization?: Personalization;
  child_name?: string;
  template?: Template;
  volume?: number;
  audio_data?: string;
  script?: string;
  voice?: string;
  speed?: number;
  audio_class?: string;
  duration?: number;
  template_context?: {
    template_type?: string;
    asset_purpose?: string;
    child_name?: string;
    template_specific?: boolean;
  };
  review?: {
    safe_zone?: SafeZone[];
    approval_notes?: string;
    rejection_reason?: string;
    reviewed_at?: string;
    reviewed_by?: string;
  };
  letter?: string;
  imageType?: ImageType;
  artStyle?: string;
  aspectRatio?: AspectRatio;
  ageRange?: string;
  safeZone?: SafeZone;
  targetLetter?: string;
  additionalContext?: string;
  generatedAt?: string;
  variations?: string[];
}

export interface Asset {
  id: string;
  title?: string;
  theme: string;
  type: AssetType;
  status: AssetStatus;
  file_url?: string;
  file_size?: number;
  prompt?: string;
  tags?: string[];
  created_at: string;
  metadata?: AssetMetadata;
}

export interface AssetFilters {
  status: 'all' | AssetStatus;
  type: 'all' | AssetType;
  template: 'all' | Template;
  search: string;
}

export interface AssetStats {
  totalAssets: number;
  pendingAssets: number;
  approvedAssets: number;
  rejectedAssets: number;
}

export interface UploadForm {
  theme: string;
  type: AssetType;
  description: string;
  tags: string;
  project_id: string;
  prompt: string;
  personalization: Personalization;
  child_name: string;
  template: Template | '';
  volume: number;
  audio_class: string;
  letter: string;
}

export interface ReviewForm {
  safe_zone: SafeZone[];
  approval_notes: string;
  rejection_reason: string;
}

export interface EditForm {
  title: string;
  theme: string;
  description: string;
  tags: string;
  prompt: string;
  personalization: Personalization;
  child_name: string;
  template: Template | '';
  volume: number;
  audio_class: string;
  letter: string;
  imageType: ImageType | '';
  artStyle: string;
  aspectRatio: AspectRatio;
  ageRange: string;
  safeZone: SafeZone;
  targetLetter: string;
  additionalContext: string;
}

export interface BulkUploadForm {
  description: string;
  tags: string;
  prompt: string;
  personalization: Personalization;
  child_name: string;
  template: Template | '';
  volume: number;
  audio_class: string;
}

export type ViewMode = 'all' | 'review' | 'viewer';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalAssets: number;
  assetsPerPage: number;
}

export interface AssetOperationResult {
  success: boolean;
  message?: string;
  asset?: Asset;
  error?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: AssetFilters;
  created_at: string;
  user_id?: string;
}
