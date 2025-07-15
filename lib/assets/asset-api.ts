import { supabase } from '@/lib/supabase';
import { 
  Asset, 
  AssetFilters, 
  AssetStats, 
  AssetOperationResult,
  UploadForm,
  BulkUploadForm,
  ReviewForm,
  EditForm,
  PaginationInfo
} from './asset-types';
import { ASSETS_PER_PAGE } from './asset-constants';

export interface FetchAssetsOptions {
  page?: number;
  filters?: AssetFilters;
  assetsPerPage?: number;
}

export interface FetchAssetsResult {
  assets: Asset[];
  pagination: PaginationInfo;
  error?: string;
}

/**
 * Fetch assets with filtering, searching, and pagination
 */
export async function fetchAssets(options: FetchAssetsOptions = {}): Promise<FetchAssetsResult> {
  const { 
    page = 1, 
    filters = { status: 'all', type: 'all', template: 'all', search: '' },
    assetsPerPage = ASSETS_PER_PAGE 
  } = options;

  try {
    // Build base query
    let query = supabase.from('assets').select('*');
    
    // Apply status filter
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    
    // Apply template filter
    if (filters.template !== 'all') {
      query = query.eq('metadata->template', filters.template);
    }
    
    // Apply search filter
    if (filters.search) {
      query = query.or(`theme.ilike.%${filters.search}%,prompt.ilike.%${filters.search}%,metadata->description.ilike.%${filters.search}%,metadata->child_name.ilike.%${filters.search}%,metadata->prompt.ilike.%${filters.search}%,metadata->audio_class.ilike.%${filters.search}%,metadata->letter.ilike.%${filters.search}%`);
    }
    
    // Get total count for pagination
    let countQuery = supabase.from('assets').select('*', { count: 'exact', head: true });
    
    // Apply the same filters to count query
    if (filters.status !== 'all') {
      countQuery = countQuery.eq('status', filters.status);
    }
    if (filters.type !== 'all') {
      countQuery = countQuery.eq('type', filters.type);
    }
    if (filters.template !== 'all') {
      countQuery = countQuery.eq('metadata->template', filters.template);
    }
    if (filters.search) {
      countQuery = countQuery.or(`theme.ilike.%${filters.search}%,prompt.ilike.%${filters.search}%,metadata->description.ilike.%${filters.search}%,metadata->child_name.ilike.%${filters.search}%,metadata->prompt.ilike.%${filters.search}%,metadata->audio_class.ilike.%${filters.search}%,metadata->letter.ilike.%${filters.search}%`);
    }
    
    const { count: totalAssets, error: countError } = await countQuery;
    
    if (countError) {
      throw countError;
    }
    
    // Calculate pagination
    const from = (page - 1) * assetsPerPage;
    const to = from + assetsPerPage - 1;
    const totalPages = Math.ceil((totalAssets || 0) / assetsPerPage);
    
    // Fetch assets with pagination
    const { data: assets, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return {
      assets: assets || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalAssets: totalAssets || 0,
        assetsPerPage,
      },
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    return {
      assets: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalAssets: 0,
        assetsPerPage,
      },
      error: error instanceof Error ? error.message : 'Failed to fetch assets',
    };
  }
}

/**
 * Fetch pending assets for review queue
 */
export async function fetchPendingAssets(): Promise<Asset[]> {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending assets:', error);
    return [];
  }
}

/**
 * Fetch asset statistics
 */
export async function fetchAssetStats(): Promise<AssetStats> {
  try {
    const [totalResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
      supabase.from('assets').select('*', { count: 'exact', head: true }),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);

    return {
      totalAssets: totalResult.count || 0,
      pendingAssets: pendingResult.count || 0,
      approvedAssets: approvedResult.count || 0,
      rejectedAssets: rejectedResult.count || 0,
    };
  } catch (error) {
    console.error('Error fetching asset stats:', error);
    return {
      totalAssets: 0,
      pendingAssets: 0,
      approvedAssets: 0,
      rejectedAssets: 0,
    };
  }
}

/**
 * Upload a single asset file
 */
export async function uploadAsset(file: File, formData: UploadForm): Promise<AssetOperationResult> {
  try {
    if (!file || !formData.theme) {
      return {
        success: false,
        error: 'File and theme are required',
      };
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `assets/${formData.type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    // Create asset record
    const assetData = {
      theme: formData.theme,
      type: formData.type,
      status: 'pending' as const,
      file_url: publicUrl,
      prompt: formData.prompt || null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        description: formData.description,
        project_id: formData.project_id,
        prompt: formData.prompt,
        personalization: formData.personalization,
        child_name: formData.child_name || null,
        template: formData.template || null,
        volume: formData.volume,
        audio_class: formData.audio_class || null,
        letter: formData.letter || null,
      },
    };

    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert(assetData)
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset uploaded successfully',
    };
  } catch (error) {
    console.error('Error uploading asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload asset',
    };
  }
}

/**
 * Bulk upload assets
 */
export async function bulkUploadAssets(
  files: File[], 
  formData: BulkUploadForm
): Promise<AssetOperationResult[]> {
  const results: AssetOperationResult[] = [];

  for (const file of files) {
    try {
      // Determine file type from extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let assetType: 'image' | 'audio' | 'video' | 'prompt' = 'image';
      
      if (fileExt && ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExt)) {
        assetType = 'audio';
      } else if (fileExt && ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExt)) {
        assetType = 'video';
      } else if (fileExt && ['txt', 'md'].includes(fileExt)) {
        assetType = 'prompt';
      }

      // Create upload form for this file
      const uploadForm: UploadForm = {
        theme: file.name.replace(/\.[^/.]+$/, ""), // filename without extension
        type: assetType,
        description: formData.description,
        tags: formData.tags,
        project_id: '',
        prompt: formData.prompt,
        personalization: formData.personalization,
        child_name: formData.child_name,
        template: formData.template,
        volume: formData.volume,
        audio_class: formData.audio_class,
        letter: '',
      };

      const result = await uploadAsset(file, uploadForm);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return results;
}

/**
 * Approve an asset
 */
export async function approveAsset(assetId: string): Promise<AssetOperationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .update({ 
        status: 'approved',
        metadata: {
          ...((await supabase.from('assets').select('metadata').eq('id', assetId).single()).data?.metadata || {}),
          review: {
            safe_zone: ['all_ok'],
            approval_notes: '',
            rejection_reason: '',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          }
        }
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset approved successfully',
    };
  } catch (error) {
    console.error('Error approving asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve asset',
    };
  }
}

/**
 * Reject an asset
 */
export async function rejectAsset(assetId: string, reason?: string): Promise<AssetOperationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .update({ 
        status: 'rejected',
        metadata: {
          ...((await supabase.from('assets').select('metadata').eq('id', assetId).single()).data?.metadata || {}),
          review: {
            safe_zone: [],
            approval_notes: '',
            rejection_reason: reason || 'Asset rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          }
        }
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset rejected successfully',
    };
  } catch (error) {
    console.error('Error rejecting asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject asset',
    };
  }
}

/**
 * Approve asset with detailed review
 */
export async function approveAssetWithReview(
  assetId: string, 
  reviewData: ReviewForm, 
  editData?: Partial<EditForm>
): Promise<AssetOperationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get current asset data
    const { data: currentAsset } = await supabase
      .from('assets')
      .select('metadata')
      .eq('id', assetId)
      .single();

    const updateData: any = {
      status: 'approved',
      metadata: {
        ...(currentAsset?.metadata || {}),
        ...(editData && {
          description: editData.description,
          prompt: editData.prompt,
          personalization: editData.personalization,
          child_name: editData.child_name,
          template: editData.template,
          volume: editData.volume,
          audio_class: editData.audio_class,
          letter: editData.letter,
          imageType: editData.imageType,
          artStyle: editData.artStyle,
          aspectRatio: editData.aspectRatio,
          ageRange: editData.ageRange,
          safeZone: editData.safeZone,
          targetLetter: editData.targetLetter,
          additionalContext: editData.additionalContext,
        }),
        review: {
          safe_zone: reviewData.safe_zone,
          approval_notes: reviewData.approval_notes,
          rejection_reason: '',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        }
      }
    };

    if (editData?.theme) {
      updateData.theme = editData.theme;
    }

    if (editData?.tags) {
      updateData.tags = editData.tags.split(',').map(tag => tag.trim());
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset approved with review',
    };
  } catch (error) {
    console.error('Error approving asset with review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve asset',
    };
  }
}

/**
 * Reject asset with detailed review
 */
export async function rejectAssetWithReview(
  assetId: string, 
  reviewData: ReviewForm
): Promise<AssetOperationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get current asset data
    const { data: currentAsset } = await supabase
      .from('assets')
      .select('metadata')
      .eq('id', assetId)
      .single();

    const { data: asset, error } = await supabase
      .from('assets')
      .update({ 
        status: 'rejected',
        metadata: {
          ...(currentAsset?.metadata || {}),
          review: {
            safe_zone: reviewData.safe_zone,
            approval_notes: reviewData.approval_notes,
            rejection_reason: reviewData.rejection_reason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          }
        }
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset rejected with review',
    };
  } catch (error) {
    console.error('Error rejecting asset with review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject asset',
    };
  }
}

/**
 * Update asset metadata
 */
export async function updateAsset(assetId: string, updateData: Partial<EditForm>): Promise<AssetOperationResult> {
  try {
    // Get current asset data
    const { data: currentAsset } = await supabase
      .from('assets')
      .select('metadata, tags')
      .eq('id', assetId)
      .single();

    const updatedData: any = {};

    if (updateData.theme) {
      updatedData.theme = updateData.theme;
    }

    if (updateData.tags) {
      updatedData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    // Update metadata
    updatedData.metadata = {
      ...(currentAsset?.metadata || {}),
      ...(updateData.description && { description: updateData.description }),
      ...(updateData.prompt && { prompt: updateData.prompt }),
      ...(updateData.personalization && { personalization: updateData.personalization }),
      ...(updateData.child_name !== undefined && { child_name: updateData.child_name }),
      ...(updateData.template !== undefined && { template: updateData.template }),
      ...(updateData.volume !== undefined && { volume: updateData.volume }),
      ...(updateData.audio_class !== undefined && { audio_class: updateData.audio_class }),
      ...(updateData.letter !== undefined && { letter: updateData.letter }),
      ...(updateData.imageType !== undefined && { imageType: updateData.imageType }),
      ...(updateData.artStyle !== undefined && { artStyle: updateData.artStyle }),
      ...(updateData.aspectRatio && { aspectRatio: updateData.aspectRatio }),
      ...(updateData.ageRange !== undefined && { ageRange: updateData.ageRange }),
      ...(updateData.safeZone && { safeZone: updateData.safeZone }),
      ...(updateData.targetLetter !== undefined && { targetLetter: updateData.targetLetter }),
      ...(updateData.additionalContext !== undefined && { additionalContext: updateData.additionalContext }),
    };

    const { data: asset, error } = await supabase
      .from('assets')
      .update(updatedData)
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      asset: asset as Asset,
      message: 'Asset updated successfully',
    };
  } catch (error) {
    console.error('Error updating asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update asset',
    };
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<AssetOperationResult> {
  try {
    // Get asset to delete file from storage
    const { data: asset } = await supabase
      .from('assets')
      .select('file_url')
      .eq('id', assetId)
      .single();

    // Delete from database
    const { error: dbError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (dbError) throw dbError;

    // Try to delete file from storage (don't fail if this fails)
    if (asset?.file_url) {
      try {
        const filePath = asset.file_url.split('/').slice(-3).join('/'); // Extract path from URL
        await supabase.storage.from('assets').remove([filePath]);
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }
    }

    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    };
  }
}

/**
 * Fetch user names for reviewer display
 */
export async function fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
  try {
    if (userIds.length === 0) return {};

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds);

    if (error) throw error;

    const nameMap: Record<string, string> = {};
    users?.forEach(user => {
      nameMap[user.id] = user.name || user.email || user.id;
    });

    return nameMap;
  } catch (error) {
    console.error('Error fetching user names:', error);
    return {};
  }
}
