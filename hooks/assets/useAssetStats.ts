import { useState, useEffect, useCallback } from 'react';
import { AssetStats } from '@/lib/assets/asset-types';
import { fetchAssetStats } from '@/lib/assets/asset-api';

export interface UseAssetStatsOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseAssetStatsReturn {
  stats: AssetStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing asset statistics
 */
export function useAssetStats(options: UseAssetStatsOptions = {}): UseAssetStatsReturn {
  const { autoFetch = true, refreshInterval } = options;

  // State
  const [stats, setStats] = useState<AssetStats>({
    totalAssets: 0,
    pendingAssets: 0,
    approvedAssets: 0,
    rejectedAssets: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats function
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAssetStats();
      setStats(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch asset statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchStats]);

  // Actions
  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
    refresh,
  };
}

/**
 * Hook for calculating derived statistics
 */
export function useDerivedStats(stats: AssetStats) {
  return {
    approvalRate: stats.totalAssets > 0 
      ? Math.round((stats.approvedAssets / stats.totalAssets) * 100) 
      : 0,
    rejectionRate: stats.totalAssets > 0 
      ? Math.round((stats.rejectedAssets / stats.totalAssets) * 100) 
      : 0,
    pendingRate: stats.totalAssets > 0 
      ? Math.round((stats.pendingAssets / stats.totalAssets) * 100) 
      : 0,
    reviewedAssets: stats.approvedAssets + stats.rejectedAssets,
    reviewProgress: stats.totalAssets > 0 
      ? Math.round(((stats.approvedAssets + stats.rejectedAssets) / stats.totalAssets) * 100) 
      : 0,
  };
}
