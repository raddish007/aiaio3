import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WishButtonService } from '@/services/wish-button/WishButtonService';

export const useAssetModal = () => {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const openAssetModal = useCallback(async (asset: any) => {
    console.log('🔍 Opening asset modal for:', asset);

    if (!asset.id) {
      console.warn('⚠️ Cannot open modal: Asset has no ID');
      return;
    }

    try {
      // Fetch fresh asset data from database
      const { data: assetData, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset.id)
        .single();

      if (error) {
        console.error('❌ Error fetching asset data:', error);
        setSelectedAsset(asset); // Fallback to provided asset
      } else {
        console.log('✅ Fetched fresh asset data:', assetData);
        setSelectedAsset({
          ...asset,
          ...assetData,
          // Ensure we preserve the UI formatting
          name: asset.name,
          description: asset.description
        });
      }

      setIsAssetModalOpen(true);
    } catch (error) {
      console.error('❌ Error in openAssetModal:', error);
      setSelectedAsset(asset); // Fallback
      setIsAssetModalOpen(true);
    }
  }, []);

  const closeAssetModal = useCallback(() => {
    setSelectedAsset(null);
    setIsAssetModalOpen(false);
  }, []);

  const handleAssetApprove = useCallback(async (asset: any, onSuccess?: () => void) => {
    if (!asset?.id) return;

    try {
      await WishButtonService.approveAsset(asset.id);
      console.log('✅ Asset approved successfully');
      closeAssetModal();
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error approving asset:', error);
      throw error;
    }
  }, [closeAssetModal]);

  const handleAssetReject = useCallback(async (asset: any, onSuccess?: () => void) => {
    if (!asset?.id) return;

    try {
      await WishButtonService.rejectAsset(asset.id);
      console.log('✅ Asset rejected successfully');
      closeAssetModal();
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error rejecting asset:', error);
      throw error;
    }
  }, [closeAssetModal]);

  return {
    selectedAsset,
    isAssetModalOpen,
    openAssetModal,
    closeAssetModal,
    handleAssetApprove,
    handleAssetReject
  };
};
