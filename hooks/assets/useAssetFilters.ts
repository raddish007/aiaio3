import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AssetFilters, ViewMode } from '@/lib/assets/asset-types';
import { DEFAULT_FILTERS, UI_CONSTANTS } from '@/lib/assets/asset-constants';
import { debounce } from '@/lib/assets/asset-utils';

export interface UseAssetFiltersOptions {
  syncWithUrl?: boolean;
  debounceSearch?: boolean;
  debounceDelay?: number;
}

export interface UseAssetFiltersReturn {
  // Filter state
  filters: AssetFilters;
  setFilters: (filters: AssetFilters) => void;
  updateFilter: (key: keyof AssetFilters, value: string) => void;
  resetFilters: () => void;
  
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Search with debouncing
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  
  // Filter presets
  applyPreset: (preset: 'pending' | 'approved' | 'rejected' | 'all') => void;
  
  // URL synchronization
  syncFiltersToUrl: () => void;
  loadFiltersFromUrl: () => void;
  
  // Utility functions
  hasActiveFilters: boolean;
  getFilterCount: () => number;
  getActiveFilterSummary: () => string;
}

/**
 * Hook for managing asset filters with URL synchronization and debouncing
 */
export function useAssetFilters(options: UseAssetFiltersOptions = {}): UseAssetFiltersReturn {
  const {
    syncWithUrl = true,
    debounceSearch = true,
    debounceDelay = UI_CONSTANTS.DEBOUNCE_DELAY,
  } = options;

  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState<AssetFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearchUpdate = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, debounceDelay),
    [debounceDelay]
  );

  // Update debounced search when search term changes
  useEffect(() => {
    if (debounceSearch) {
      debouncedSearchUpdate(searchTerm);
    } else {
      setDebouncedSearchTerm(searchTerm);
    }
  }, [searchTerm, debounceSearch, debouncedSearchUpdate]);

  // Update filters when debounced search term changes
  useEffect(() => {
    updateFilter('search', debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Filter management
  const updateFilter = useCallback((key: keyof AssetFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // Sync to URL if enabled
    if (syncWithUrl) {
      const newFilters = { ...filters, [key]: value };
      syncFiltersToUrl(newFilters);
    }
  }, [filters, syncWithUrl]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    
    // Sync to URL if enabled
    if (syncWithUrl) {
      syncFiltersToUrl(DEFAULT_FILTERS);
    }
  }, [syncWithUrl]);

  // View mode management
  const updateViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    
    // Auto-apply filter presets based on view mode
    if (mode === 'review') {
      updateFilter('status', 'pending');
    } else if (mode === 'all') {
      // Don't change status filter for 'all' view
    }
    
    // Sync to URL if enabled
    if (syncWithUrl) {
      const query = { ...router.query, view: mode };
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    }
  }, [updateFilter, syncWithUrl, router]);

  // Filter presets
  const applyPreset = useCallback((preset: 'pending' | 'approved' | 'rejected' | 'all') => {
    const presetFilters: AssetFilters = {
      ...DEFAULT_FILTERS,
      status: preset,
    };
    
    setFilters(presetFilters);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    
    // Sync to URL if enabled
    if (syncWithUrl) {
      syncFiltersToUrl(presetFilters);
    }
  }, [syncWithUrl]);

  // URL synchronization
  const syncFiltersToUrl = useCallback((filtersToSync?: AssetFilters) => {
    if (!syncWithUrl) return;
    
    const currentFilters = filtersToSync || filters;
    const query: Record<string, string> = {};
    
    // Copy existing query params (convert arrays to strings)
    Object.entries(router.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        query[key] = value;
      } else if (Array.isArray(value)) {
        query[key] = value[0] || '';
      }
    });
    
    // Add filters to query
    if (currentFilters.status !== 'all') {
      query.status = currentFilters.status;
    } else {
      delete query.status;
    }
    
    if (currentFilters.type !== 'all') {
      query.type = currentFilters.type;
    } else {
      delete query.type;
    }
    
    if (currentFilters.template !== 'all') {
      query.template = currentFilters.template;
    } else {
      delete query.template;
    }
    
    if (currentFilters.search) {
      query.search = currentFilters.search;
    } else {
      delete query.search;
    }
    
    // Add view mode
    if (viewMode !== 'all') {
      query.view = viewMode;
    } else {
      delete query.view;
    }
    
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [syncWithUrl, filters, viewMode, router]);

  const loadFiltersFromUrl = useCallback(() => {
    if (!syncWithUrl) return;
    
    const { query } = router;
    
    const statusParam = Array.isArray(query.status) ? query.status[0] : query.status;
    const typeParam = Array.isArray(query.type) ? query.type[0] : query.type;
    const templateParam = Array.isArray(query.template) ? query.template[0] : query.template;
    const searchParam = Array.isArray(query.search) ? query.search[0] : query.search;
    const viewParam = Array.isArray(query.view) ? query.view[0] : query.view;
    
    const urlFilters: AssetFilters = {
      status: (statusParam as AssetFilters['status']) || 'all',
      type: (typeParam as AssetFilters['type']) || 'all',
      template: (templateParam as AssetFilters['template']) || 'all',
      search: searchParam || '',
    };
    
    const urlViewMode = (viewParam as ViewMode) || 'all';
    
    setFilters(urlFilters);
    setViewMode(urlViewMode);
    setSearchTerm(urlFilters.search);
    setDebouncedSearchTerm(urlFilters.search);
  }, [syncWithUrl, router]);

  // Load filters from URL on mount
  useEffect(() => {
    if (syncWithUrl && router.isReady) {
      loadFiltersFromUrl();
    }
  }, [syncWithUrl, router.isReady, loadFiltersFromUrl]);

  // Computed values
  const hasActiveFilters = filters.status !== 'all' || 
                          filters.type !== 'all' || 
                          filters.template !== 'all' || 
                          filters.search !== '';

  const getFilterCount = useCallback(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.template !== 'all') count++;
    if (filters.search !== '') count++;
    return count;
  }, [filters]);

  const getActiveFilterSummary = useCallback(() => {
    const activeParts = [];
    
    if (filters.status !== 'all') {
      activeParts.push(`Status: ${filters.status}`);
    }
    if (filters.type !== 'all') {
      activeParts.push(`Type: ${filters.type}`);
    }
    if (filters.template !== 'all') {
      activeParts.push(`Template: ${filters.template}`);
    }
    if (filters.search !== '') {
      activeParts.push(`Search: "${filters.search}"`);
    }
    
    return activeParts.join(', ') || 'No active filters';
  }, [filters]);

  return {
    // Filter state
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    
    // View mode
    viewMode,
    setViewMode: updateViewMode,
    
    // Search with debouncing
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    
    // Filter presets
    applyPreset,
    
    // URL synchronization
    syncFiltersToUrl,
    loadFiltersFromUrl,
    
    // Utility functions
    hasActiveFilters,
    getFilterCount,
    getActiveFilterSummary,
  };
}

/**
 * Hook for managing filter history and favorites
 */
export function useFilterHistory() {
  const [filterHistory, setFilterHistory] = useState<AssetFilters[]>([]);
  const [favoriteFilters, setFavoriteFilters] = useState<Array<{
    name: string;
    filters: AssetFilters;
  }>>([]);

  const addToHistory = useCallback((filters: AssetFilters) => {
    setFilterHistory(prev => {
      // Don't add if it's the same as the last entry
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(filters)) {
        return prev;
      }
      
      // Keep only last 10 entries
      const newHistory = [...prev, filters].slice(-10);
      return newHistory;
    });
  }, []);

  const addToFavorites = useCallback((name: string, filters: AssetFilters) => {
    setFavoriteFilters(prev => [
      ...prev.filter(fav => fav.name !== name), // Remove existing with same name
      { name, filters }
    ]);
  }, []);

  const removeFromFavorites = useCallback((name: string) => {
    setFavoriteFilters(prev => prev.filter(fav => fav.name !== name));
  }, []);

  const clearHistory = useCallback(() => {
    setFilterHistory([]);
  }, []);

  return {
    filterHistory,
    favoriteFilters,
    addToHistory,
    addToFavorites,
    removeFromFavorites,
    clearHistory,
  };
}
