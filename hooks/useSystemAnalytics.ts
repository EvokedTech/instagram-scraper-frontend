import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { api } from '@/lib/api';
import socketService from '@/lib/socket';

interface SystemHealth {
  mongodb: boolean;
  redis: boolean;
  api: boolean;
  lastChecked: string;
}

interface CollectionStats {
  name: string;
  count: number;
  size: string;
}

interface SystemAnalyticsData {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  totalRootProfiles: number;
  totalRelatedProfiles: number;
  totalProfilesScraped: number;
  averageSessionDuration: string;
  processingRate: number;
  queueStats: {
    rootProfileQueue: any;
    relatedProfileQueue: any;
    depthQueue: any;
  };
  systemHealth: SystemHealth;
  collectionStats: CollectionStats[];
  recentActivity: Array<{
    timestamp: string;
    type: string;
    message: string;
    sessionId?: string;
  }>;
}

export function useSystemAnalytics() {
  const { isConnected, subscribe } = useWebSocket();
  const [data, setData] = useState<SystemAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial system analytics
  const fetchSystemData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/dashboard/system');
      setData(response.data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch system analytics');
      console.error('Error fetching system analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to system events
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to system-wide events
    socketService.subscribeToSystem();

    // System metrics updates
    const unsubscribeMetrics = subscribe('system:metrics', (metricsData: any) => {
      setData(prev => {
        if (!prev) return metricsData;
        
        return {
          ...prev,
          totalSessions: metricsData.totalSessions || prev.totalSessions,
          activeSessions: metricsData.activeSessions || prev.activeSessions,
          processingRate: metricsData.processingRate || prev.processingRate,
          systemHealth: metricsData.systemHealth || prev.systemHealth,
          queueStats: metricsData.queueStats || prev.queueStats,
        };
      });
      setLastUpdate(new Date());
    });

    // Session status changes affect system stats
    const unsubscribeSessionStatus = subscribe('session:statusChanged', () => {
      // Refresh system data when session status changes
      fetchSystemData();
    });

    // System notifications for recent activity
    const unsubscribeNotifications = subscribe('system:notification', (notification: any) => {
      setData(prev => {
        if (!prev) return prev;
        
        const newActivity = {
          timestamp: new Date().toISOString(),
          type: notification.type || 'info',
          message: notification.message,
          sessionId: notification.sessionId,
        };

        return {
          ...prev,
          recentActivity: [newActivity, ...prev.recentActivity.slice(0, 49)], // Keep last 50
        };
      });
      setLastUpdate(new Date());
    });

    // Queue status updates
    const unsubscribeQueue = subscribe('queue:statusUpdate', (queueData: any) => {
      setData(prev => {
        if (!prev) return prev;
        
        const queueType = queueData.type;
        return {
          ...prev,
          queueStats: {
            ...prev.queueStats,
            [queueType]: queueData,
          },
        };
      });
      setLastUpdate(new Date());
    });

    // System errors
    const unsubscribeErrors = subscribe('system:error', (errorData: any) => {
      setData(prev => {
        if (!prev) return prev;
        
        const errorActivity = {
          timestamp: new Date().toISOString(),
          type: 'error',
          message: errorData.error || 'System error occurred',
          sessionId: errorData.sessionId,
        };

        return {
          ...prev,
          recentActivity: [errorActivity, ...prev.recentActivity.slice(0, 49)],
        };
      });
    });

    // Initial data fetch
    fetchSystemData();

    // Periodic health check (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      fetchSystemData();
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(healthCheckInterval);
      unsubscribeMetrics();
      unsubscribeSessionStatus();
      unsubscribeNotifications();
      unsubscribeQueue();
      unsubscribeErrors();
    };
  }, [isConnected, subscribe, fetchSystemData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  };
}