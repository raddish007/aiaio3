import { supabase } from '@/lib/supabase';
import { Child, ContentProject, WishButtonAssets, AssetStatusType } from '@/types/wish-button';

export class WishButtonService {
  /**
   * Fetches all children from the database
   */
  static async fetchChildren(): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetches previous stories for a specific child
   */
  static async fetchPreviousStories(child: Child, forceRefresh = false): Promise<ContentProject[]> {
    let query = supabase
      .from('content_projects')
      .select('*')
      .eq('metadata->>template', 'wish-button')
      .eq('metadata->>child_name', child.name)
      .order('created_at', { ascending: false });
    
    // Force fresh data by adding a harmless filter that doesn't change results
    if (forceRefresh) {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Previous stories not available:', error.message);
      return [];
    }
    
    return data || [];
  }

  /**
   * Deletes a story and its associated assets
   */
  static async deleteStory(storyId: string): Promise<void> {
    // Delete associated assets first
    const { error: assetsError } = await supabase
      .from('assets')
      .delete()
      .eq('project_id', storyId);

    if (assetsError) {
      console.error('Error deleting assets:', assetsError);
      throw new Error(`Failed to delete assets: ${assetsError.message}`);
    }

    // Delete the story project
    const { error: projectError } = await supabase
      .from('content_projects')
      .delete()
      .eq('id', storyId);

    if (projectError) {
      console.error('Error deleting story:', projectError);
      throw new Error(`Failed to delete story: ${projectError.message}`);
    }
  }

  /**
   * Refreshes assets from database for a specific project
   */
  static async refreshAssetsFromDatabase(projectId: string, currentAssets: WishButtonAssets): Promise<WishButtonAssets> {
    if (!projectId) {
      throw new Error('No project ID provided for refresh');
    }
    
    // Query for wish-button assets
    const { data: dbAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Error fetching assets: ${error.message}`);
    }

    // Filter for wish-button assets on the client side
    const wishButtonAssets = dbAssets?.filter(asset => {
      const metadata = asset.metadata || {};
      return (
        metadata.template === 'wish-button' ||
        metadata.template_context?.template_type === 'wish-button'
      );
    }) || [];

    const updatedAssets = { ...currentAssets };

    wishButtonAssets.forEach(dbAsset => {
      // Get asset purpose from multiple possible locations
      const assetPurpose = dbAsset.metadata?.asset_purpose || 
                         dbAsset.metadata?.template_context?.asset_purpose ||
                         dbAsset.metadata?.page ||
                         dbAsset.metadata?.assetPurpose;
      const assetType = dbAsset.type;
      
      // Map database assets to UI asset structure
      let assetKey = '';
      if (assetPurpose && assetType === 'image') {
        assetKey = `${assetPurpose}_image`;
      } else if (assetPurpose && assetType === 'audio') {
        assetKey = `${assetPurpose}_audio`;
      } else if (assetPurpose === 'background_music') {
        assetKey = 'background_music';
      }

      if (assetKey && updatedAssets[assetKey as keyof WishButtonAssets]) {
        const currentAsset = updatedAssets[assetKey as keyof WishButtonAssets];
        const mappedStatus: AssetStatusType = dbAsset.status === 'approved' ? 'ready' : 
                           dbAsset.status === 'pending' ? 'pending_review' : 
                           dbAsset.status;
        
        // Special protection for background music
        if (assetKey === 'background_music') {
          const isRealBackgroundMusic = dbAsset.metadata?.asset_purpose === 'background_music' || 
                                       dbAsset.metadata?.template_context?.asset_purpose === 'background_music' ||
                                       dbAsset.id === 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9';
          
          if (isRealBackgroundMusic) {
            updatedAssets[assetKey as keyof WishButtonAssets] = {
              ...currentAsset,
              status: mappedStatus,
              url: dbAsset.file_url,
              id: dbAsset.id
            };
          }
        } else {
          updatedAssets[assetKey as keyof WishButtonAssets] = {
            ...currentAsset,
            status: mappedStatus,
            url: dbAsset.file_url,
            id: dbAsset.id
          };
        }
      }
    });

    // Handle background music fallback
    await this.ensureBackgroundMusic(updatedAssets);

    return updatedAssets;
  }

  /**
   * Ensures background music is properly set
   */
  private static async ensureBackgroundMusic(assets: WishButtonAssets): Promise<void> {
    if (!assets.background_music || assets.background_music.status === 'missing' || !assets.background_music.url) {
      try {
        const { data: bgMusicAsset, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9')
          .single();
          
        if (!error && bgMusicAsset) {
          assets.background_music = {
            type: 'audio',
            name: 'Wish Button Background Music',
            description: bgMusicAsset.metadata?.description || 'Pre-approved background music for wish-button template',
            status: bgMusicAsset.status === 'approved' ? 'ready' : bgMusicAsset.status,
            id: bgMusicAsset.id,
            url: bgMusicAsset.file_url
          };
        } else {
          // Use fallback background music asset
          assets.background_music = {
            type: 'audio',
            name: 'Wish Button Background Music',
            description: 'Pre-approved background music for wish-button template',
            status: 'ready',
            id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
            url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
          };
        }
      } catch (error) {
        console.error('Error fetching background music:', error);
        // Use fallback background music asset
        assets.background_music = {
          type: 'audio',
          name: 'Wish Button Background Music',
          description: 'Pre-approved background music for wish-button template',
          status: 'ready',
          id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
          url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
        };
      }
    }
  }

  /**
   * Approves an asset
   */
  static async approveAsset(assetId: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .update({ status: 'approved' })
      .eq('id', assetId);

    if (error) {
      throw new Error(`Failed to approve asset: ${error.message}`);
    }
  }

  /**
   * Rejects an asset
   */
  static async rejectAsset(assetId: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .update({ status: 'rejected' })
      .eq('id', assetId);

    if (error) {
      throw new Error(`Failed to reject asset: ${error.message}`);
    }
  }
}
