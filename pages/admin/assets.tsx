import React, { useState } from 'react';
import { AssetsLayout } from '@/components/assets/AssetsLayout';
import { AssetToolbar } from '@/components/assets/AssetToolbar';
import { AssetStats } from '@/components/assets/AssetStats';
import { AssetFilters } from '@/components/assets/AssetFilters';
import { AssetTable } from '@/components/assets/AssetTable';
import { AssetUploadModal } from '@/components/assets/AssetUpload/AssetUploadModal';
import { AssetDetailModal } from '@/components/assets/AssetModal';
import { useAssets } from '@/hooks/assets/useAssets';
import { useAssetStats } from '@/hooks/assets/useAssetStats';
import { useAssetFilters } from '@/hooks/assets/useAssetFilters';
import { useAssetModal } from '@/hooks/assets/useAssetModal';
import { useAssetReview } from '@/hooks/assets/useAssetReview';
import { useTableSelection } from '@/hooks/assets/useTableSelection';
import { ViewMode } from '@/lib/assets/asset-types';

export default function AssetsPage() {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Custom hooks for data management
  const {
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
  } = useAssetFilters({ syncWithUrl: true });

  const {
    assets,
    pagination,
    loading: assetsLoading,
    error: assetsError,
    setFilters: setAssetsFilters,
    currentPage,
    setCurrentPage,
    refetch: refetchAssets,
  } = useAssets({ 
    initialFilters: { ...filters, search: debouncedSearchTerm }
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAssetStats();

  const {
    isOpen: isModalOpen,
    selectedAsset,
    openModal,
    closeModal,
    goToNextAsset,
    goToPreviousAsset,
    hasNextAsset,
    hasPreviousAsset,
  } = useAssetModal({ 
    assets, 
    enableKeyboardShortcuts: true 
  });

  const {
    approveQuick,
    rejectQuick,
    getNextPendingAsset,
  } = useAssetReview({
    assets,
    autoAdvance: true,
    onAssetReviewed: async () => {
      await refetchAssets();
      await refetchStats();
    },
  });

  const {
    selectedIds,
    isAllSelected,
    selectedCount,
    selectAsset,
    deselectAsset,
    toggleAsset,
    selectAll,
    deselectAll,
    toggleSelectAll,
    bulkApprove,
    bulkReject,
    bulkDelete,
    isSelected,
  } = useTableSelection({
    onBulkApprove: async (ids) => {
      // TODO: Implement bulk approve API call
      console.log('Bulk approve:', ids);
      await refetchAssets();
      await refetchStats();
    },
    onBulkReject: async (ids) => {
      // TODO: Implement bulk reject API call
      console.log('Bulk reject:', ids);
      await refetchAssets();
      await refetchStats();
    },
    onBulkDelete: async (ids) => {
      // TODO: Implement bulk delete API call
      console.log('Bulk delete:', ids);
      await refetchAssets();
      await refetchStats();
    },
  });

  // Event handlers
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleAssetClick = (asset: any) => {
    openModal(asset);
  };

  const handleModalNext = () => {
    goToNextAsset();
  };

  const handleModalPrevious = () => {
    goToPreviousAsset();
  };

  const handleAssetApprove = async (asset: any) => {
    try {
      await approveQuick(asset.id);
      // Auto-advance to next pending asset or close modal
      const nextPending = getNextPendingAsset(asset.id);
      if (nextPending) {
        openModal(nextPending);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to approve asset:', error);
    }
  };

  const handleAssetReject = async (asset: any) => {
    try {
      await rejectQuick(asset.id, 'Rejected by admin');
      // Auto-advance to next pending asset or close modal
      const nextPending = getNextPendingAsset(asset.id);
      if (nextPending) {
        openModal(nextPending);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error('Failed to reject asset:', error);
    }
  };

  const handleUploadSuccess = () => {
    refetchAssets();
    refetchStats();
    setShowUploadModal(false);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setAssetsFilters(newFilters);
  };

  return (
    <AssetsLayout title="Asset Management" description="Upload, review, and manage all asset files">
      {/* Statistics */}
      <AssetStats 
        stats={stats} 
        isLoading={statsLoading} 
        onRefresh={refetchStats}
      />

      {/* Toolbar */}
      <AssetToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onSingleUpload={() => setShowUploadModal(true)}
        onBulkUpload={() => {
          // TODO: Implement bulk upload modal
          console.log('Open bulk upload modal');
        }}
        selectedCount={selectedCount}
        onBulkApprove={bulkApprove}
        onBulkReject={bulkReject}
        onBulkDelete={bulkDelete}
        isUploading={false}
        isBulkProcessing={false}
      />

      {/* Filters */}
      <AssetFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showPresets={false}
      />

      {/* Assets Table */}
      <AssetTable
        assets={assets}
        isLoading={assetsLoading}
        selectedIds={selectedIds}
        onAssetSelect={toggleAsset}
        onToggleSelectAll={() => toggleSelectAll(assets.map(a => a.id))}
        showSelection={true}
        onAssetClick={handleAssetClick}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <AssetUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={closeModal}
        onNext={hasNextAsset ? handleModalNext : undefined}
        onPrevious={hasPreviousAsset ? handleModalPrevious : undefined}
        onApprove={selectedAsset?.status === 'pending' ? handleAssetApprove : undefined}
        onReject={selectedAsset?.status === 'pending' ? handleAssetReject : undefined}
      />

      {/* TODO: Add Bulk Upload Modal */}
    </AssetsLayout>
  );
}
