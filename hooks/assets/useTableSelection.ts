import { useState, useCallback } from 'react';

export interface UseTableSelectionReturn {
  // Selection state
  selectedIds: Set<string>;
  isAllSelected: (ids: string[]) => boolean;
  selectedCount: number;
  
  // Selection actions
  selectAsset: (id: string) => void;
  deselectAsset: (id: string) => void;
  toggleAsset: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  toggleSelectAll: (ids: string[]) => void;
  
  // Bulk operations
  bulkApprove: () => Promise<void>;
  bulkReject: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  
  // Utilities
  isSelected: (id: string) => boolean;
  getSelectedAssets: <T extends { id: string }>(assets: T[]) => T[];
}

interface UseTableSelectionOptions {
  onBulkApprove?: (ids: string[]) => Promise<void>;
  onBulkReject?: (ids: string[]) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function useTableSelection(options: UseTableSelectionOptions = {}): UseTableSelectionReturn {
  const {
    onBulkApprove,
    onBulkReject,
    onBulkDelete,
    onSelectionChange,
  } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Selection state calculations
  const selectedCount = selectedIds.size;
  const isAllSelected = (totalIds: string[]) => {
    if (totalIds.length === 0) return false;
    return totalIds.every(id => selectedIds.has(id));
  };

  // Selection change handler
  const handleSelectionChange = useCallback((newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  }, [onSelectionChange]);

  // Individual selection actions
  const selectAsset = useCallback((id: string) => {
    const newSelectedIds = new Set(selectedIds);
    newSelectedIds.add(id);
    handleSelectionChange(newSelectedIds);
  }, [selectedIds, handleSelectionChange]);

  const deselectAsset = useCallback((id: string) => {
    const newSelectedIds = new Set(selectedIds);
    newSelectedIds.delete(id);
    handleSelectionChange(newSelectedIds);
  }, [selectedIds, handleSelectionChange]);

  const toggleAsset = useCallback((id: string) => {
    if (selectedIds.has(id)) {
      deselectAsset(id);
    } else {
      selectAsset(id);
    }
  }, [selectedIds, selectAsset, deselectAsset]);

  // Bulk selection actions
  const selectAll = useCallback((ids: string[]) => {
    const newSelectedIds = new Set(ids);
    handleSelectionChange(newSelectedIds);
  }, [handleSelectionChange]);

  const deselectAll = useCallback(() => {
    handleSelectionChange(new Set());
  }, [handleSelectionChange]);

  const toggleSelectAll = useCallback((ids: string[]) => {
    if (isAllSelected(ids)) {
      deselectAll();
    } else {
      selectAll(ids);
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // Bulk operations
  const bulkApprove = useCallback(async () => {
    if (selectedCount === 0) return;
    const ids = Array.from(selectedIds);
    await onBulkApprove?.(ids);
    deselectAll();
  }, [selectedIds, selectedCount, onBulkApprove, deselectAll]);

  const bulkReject = useCallback(async () => {
    if (selectedCount === 0) return;
    const ids = Array.from(selectedIds);
    await onBulkReject?.(ids);
    deselectAll();
  }, [selectedIds, selectedCount, onBulkReject, deselectAll]);

  const bulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    const ids = Array.from(selectedIds);
    await onBulkDelete?.(ids);
    deselectAll();
  }, [selectedIds, selectedCount, onBulkDelete, deselectAll]);

  // Utility functions
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedAssets = useCallback(<T extends { id: string }>(assets: T[]): T[] => {
    return assets.filter(asset => selectedIds.has(asset.id));
  }, [selectedIds]);

  return {
    // Selection state
    selectedIds,
    isAllSelected: (ids: string[]) => isAllSelected(ids),
    selectedCount,
    
    // Selection actions
    selectAsset,
    deselectAsset,
    toggleAsset,
    selectAll,
    deselectAll,
    toggleSelectAll,
    
    // Bulk operations
    bulkApprove,
    bulkReject,
    bulkDelete,
    
    // Utilities
    isSelected,
    getSelectedAssets,
  };
}
