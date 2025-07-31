import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface AnalysisStats {
  totalAnalyzed: number;
  totalPendingAnalysis: number;
  totalStored: number;
  totalSkipped: number;
  percentComplete: number;
  breakdown: {
    storedAdultCreators: number;
    skippedLowScore: number;
    adultContentStats: {
      average: number;
      min: number;
      max: number;
      threshold: number;
    };
  };
  n8nQueueStats?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };
  // Legacy fields that might still be returned
  pendingProfiles?: number;
  queueStats?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export function useAnalysisStats(sessionId: string | null) {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Try the new n8n endpoint first
      try {
        const response = await api.get(`/analysis/n8n/session-stats/${sessionId}`);
        setStats(response.data.data);
      } catch (n8nError: any) {
        // If n8n endpoint fails, try the legacy endpoint
        if (n8nError.response?.status === 404) {
          const response = await api.get(`/analysis/status/${sessionId}`);
          setStats(response.data.data);
        } else {
          throw n8nError;
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch analysis stats';
      setError(errorMessage);
      console.error('Error fetching analysis stats:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}