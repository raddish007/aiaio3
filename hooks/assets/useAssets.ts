import { useState, useEffect, useCallback } from 'react';
import { Asset, AssetFilters, PaginationInfo } from '@/lib/assets/asset-types';
import { DEFAULT_FILTERS, ASSETS_PER_PAGE } from '@/lib/assets/asset-constants';
import { fetchAssets, FetchAssetsResult } from '@/lib/assets/asset-api';

export interface UseAssetsOptions {
  initialFilters?: AssetFilters;
  autoFetch?: boolean;
  assetsPerPage?: number;
}

export interface UseAssetsReturn {
  // Data
  assets: Asset[];
  pagination: PaginationInfo;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: AssetFilters;
  setFilters: (filters: AssetFilters) => void;
  updateFilter: (key: keyof AssetFilters, value: string) => void;
  resetFilters: () => void;
  
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  
  // Actions
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing assets with filtering, pagination, and loading state
 */
export function useAssets(options: UseAssetsOptions = {}): UseAssetsReturn {
  const {
    initialFilters = DEFAULT_FILTERS,
    autoFetch = true,
    assetsPerPage = ASSETS_PER_PAGE,
  } = options;

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalAssets: 0,
    assetsPerPage,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssetFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch assets function
  const fetchAssetsData = useCallback(async (page: number = currentPage, currentFilters: AssetFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const result: FetchAssetsResult = await fetchAssets({
        page,
        filters: currentFilters,
        assetsPerPage,
      });

      if (result.error) {
        setError(result.error);
        setAssets([]);
        setPagination({
          currentPage: page,
          totalPages: 0,
          totalAssets: 0,
          assetsPerPage,
        });
      } else {
        setAssets(result.assets);
        setPagination(result.pagination);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(errorMessage);
      setAssets([]);
      setPagination({
        currentPage: page,
        totalPages: 0,
        totalAssets: 0,
        assetsPerPage,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, assetsPerPage]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAssetsData(currentPage, filters);
    }
  }, [currentPage, filters, autoFetch, fetchAssetsData]);

  // Filter management
  const updateFilter = useCallback((key: keyof AssetFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Pagination management
  const goToNextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pagination.totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Actions
  const refetch = useCallback(async () => {
    await fetchAssetsData(currentPage, filters);
  }, [fetchAssetsData, currentPage, filters]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await fetchAssetsData(1, filters);
  }, [fetchAssetsData, filters]);

  return {
    // Data
    assets,
    pagination,

    // State
    loading,
    error,

    // Filters
    filters,
    setFilters,
    updateFilter,
    resetFilters,

    // Pagination
    currentPage,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,

    // Actions
    refetch,
    refresh,
  };
}

/**
 * Hook for managing assets optimistically (immediate UI updates)
 */
export function useOptimisticAssets(baseAssets: Asset[]) {
  const [optimisticAssets, setOptimisticAssets] = useState<Asset[]>(baseAssets);

  // Update optimistic state when base assets change
  useEffect(() => {
    setOptimisticAssets(baseAssets);
  }, [baseAssets]);

  const updateAssetOptimistically = useCallback((assetId: string, updates: Partial<Asset>) => {
    setOptimisticAssets(prev => 
      prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, ...updates }
          : asset
      )
    );
  }, []);

  const removeAssetOptimistically = useCallback((assetId: string) => {
    setOptimisticAssets(prev => prev.filter(asset => asset.id !== assetId));
  }, []);

  const addAssetOptimistically = useCallback((asset: Asset) => {
    setOptimisticAssets(prev => [asset, ...prev]);
  }, []);

  const revertOptimisticChanges = useCallback(() => {
    setOptimisticAssets(baseAssets);
  }, [baseAssets]);

  return {
    assets: optimisticAssets,
    updateAssetOptimistically,
    removeAssetOptimistically,
    addAssetOptimistically,
    revertOptimisticChanges,
  };
}
