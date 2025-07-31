import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { api } from '@/lib/api';
import socketService from '@/lib/socket';

interface DepthStats {
  depth: number;
  total: number;
  scraped: number;
  failed: number;
  pending: number;
  inQueue: number;
  fromDatabase: number;
  needToScrape: number;
  analyzedProfiles?: number;
  pendingAnalysis?: number;
  isScrapingComplete?: boolean;
  isAnalysisComplete?: boolean;
  isFullyComplete?: boolean;
}

interface ProcessingMetrics {
  processingRate: number;
  averageTimePerProfile: number;
  estimatedTimeRemaining: string;
  apiCreditsUsed: number;
  successRate: number;
}

interface SessionMonitoringData {
  session: any;
  depthStats: DepthStats[];
  currentBatch: {
    depth: number;
    profiles: string[];
    processedCount: number;
    totalCount: number;
  } | null;
  processingMetrics: ProcessingMetrics;
  recentProfiles: any[];
  queueStatus: any;
  analysisStats?: any;
}

export function useSessionMonitoring(sessionId: string | null) {
  const { isConnected, subscribe } = useWebSocket();
  const [data, setData] = useState<SessionMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial data
  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Don't set loading to true on refresh to avoid UI flicker
      if (!data) {
        setLoading(true);
      }
      setError(null);
      
      const response = await api.get(`/dashboard/session/${sessionId}`);
      // Handle the response structure properly
      const responseData = response.data?.data || response.data;
      
      // Transform the backend response to match frontend expectations
      if (responseData && responseData.relatedProfileStats) {
        // Get queue stats by depth for mapping
        const queueStatsByDepth = responseData.queueStatsByDepth || [];
        const profileReuseStatsByDepth = responseData.profileReuseStats || [];
        
        // Transform relatedProfileStats to depthStats format
        const depthStats = responseData.relatedProfileStats.map((stat: any) => {
          const statusCounts = stat.statusBreakdown.reduce((acc: any, item: any) => {
            acc[item.status] = item.count;
            return acc;
          }, {});
          
          // Find corresponding queue stats for this depth
          const queueStats = queueStatsByDepth.find((q: any) => q.depth === stat._id) || { inQueue: 0 };
          
          // Find corresponding profile reuse stats for this depth
          const reuseStats = profileReuseStatsByDepth.find((r: any) => r._id === stat._id) || {
            existingProfiles: 0,
            scrapedProfiles: statusCounts.scraped || 0
          };
          
          return {
            depth: stat._id,
            total: stat.total,
            scraped: statusCounts.scraped || 0,
            failed: statusCounts.failed || 0,
            pending: statusCounts.pending || 0,
            inQueue: queueStats.inQueue || 0,
            fromDatabase: reuseStats.existingProfiles || 0,
            needToScrape: statusCounts.pending || 0,
            totalRelatedProfilesFound: stat.totalRelatedProfilesFound || 0,
            existingProfiles: reuseStats.existingProfiles || 0,
            actuallyScraped: reuseStats.scrapedProfiles || 0
          };
        });
        
        // Add depth 0 if we have root profile stats
        if (responseData.rootProfileStats && responseData.rootProfileStats.length > 0) {
          const rootStatusCounts = responseData.rootProfileStats.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            if (item.totalRelatedProfilesFound) {
              acc.totalRelatedProfilesFound = (acc.totalRelatedProfilesFound || 0) + item.totalRelatedProfilesFound;
            }
            return acc;
          }, {});
          
          // Get root profile reuse stats
          const rootReuseStats = responseData.rootProfileReuseStats?.[0] || {
            existingProfiles: 0,
            scrapedProfiles: rootStatusCounts.scraped || 0
          };
          
          // Get queue stats for depth 0
          const rootQueueStats = queueStatsByDepth.find((q: any) => q.depth === 0) || { inQueue: 0 };
          
          depthStats.unshift({
            depth: 0,
            total: (rootStatusCounts.scraped || 0) + (rootStatusCounts.failed || 0) + (rootStatusCounts.pending || 0),
            scraped: rootStatusCounts.scraped || 0,
            failed: rootStatusCounts.failed || 0,
            pending: rootStatusCounts.pending || 0,
            inQueue: rootQueueStats.inQueue || 0,
            fromDatabase: rootReuseStats.existingProfiles || 0,
            needToScrape: rootStatusCounts.pending || 0,
            totalRelatedProfilesFound: rootStatusCounts.totalRelatedProfilesFound || 0,
            existingProfiles: rootReuseStats.existingProfiles || 0,
            actuallyScraped: rootReuseStats.scrapedProfiles || 0
          });
        }
        
        // Merge depth progress data if available
        if (responseData.depthProgress && responseData.depthProgress.depthDetails) {
          responseData.depthProgress.depthDetails.forEach((progressDetail: any) => {
            const depthStat = depthStats.find((ds: any) => ds.depth === progressDetail.depth);
            if (depthStat) {
              depthStat.analyzedProfiles = progressDetail.analyzedProfiles || 0;
              depthStat.pendingAnalysis = progressDetail.pendingAnalysis || 0;
              depthStat.isScrapingComplete = progressDetail.isScrapingComplete || false;
              depthStat.isAnalysisComplete = progressDetail.isAnalysisComplete || false;
              depthStat.isFullyComplete = progressDetail.isFullyComplete || false;
            }
          });
        }
        
        responseData.depthStats = depthStats;
        
        // Calculate overall progress based on all depths
        if (depthStats.length > 0 && responseData.session) {
          const maxDepth = responseData.session.config?.maxDepth || 0;
          let totalProgress = 0;
          
          // Calculate progress for each depth (0 to maxDepth)
          for (let depth = 0; depth <= maxDepth; depth++) {
            const depthStat = depthStats.find((ds: any) => ds.depth === depth);
            if (depthStat) {
              // Calculate individual depth progress
              let depthProgress = 0;
              if (depthStat.total > 0) {
                const scrapingProgress = ((depthStat.scraped + depthStat.failed) / depthStat.total) * 100;
                const analysisProgress = depthStat.depth === 0 ? 100 : // Depth 0 doesn't need analysis
                  (depthStat.scraped > 0 ? ((depthStat.analyzedProfiles || 0) / depthStat.scraped) * 100 : 0);
                
                // Overall progress for this depth (50% scraping, 50% analysis)
                depthProgress = depthStat.depth === 0 ? scrapingProgress : 
                  (scrapingProgress * 0.5) + (analysisProgress * 0.5);
              }
              totalProgress += depthProgress;
            }
          }
          
          // Average progress across all depths
          const overallProgress = totalProgress / (maxDepth + 1);
          responseData.session.progressPercentage = Math.round(overallProgress);
        }
        
        responseData.depthStats = depthStats;
      } else {
        // Ensure depthStats exists even if empty
        responseData.depthStats = [];
      }
      
      // Transform processingMetrics to match frontend expectations
      if (responseData && responseData.processingMetrics) {
        const metrics = responseData.processingMetrics;
        responseData.processingMetrics = {
          processingRate: metrics.processingRate || 0,
          averageTimePerProfile: metrics.avgProcessingTime || 0,
          estimatedTimeRemaining: metrics.estimatedTimeRemaining ? 
            `${Math.floor(metrics.estimatedTimeRemaining / 60)}m ${Math.floor(metrics.estimatedTimeRemaining % 60)}s` : 
            'Calculating...',
          apiCreditsUsed: metrics.totalProcessed || 0, // Using totalProcessed as proxy for API credits
          successRate: 100 // Default to 100% since backend doesn't provide this
        };
      }
      
      setData(responseData);
      setLastUpdate(new Date());
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to fetch session data';
      setError(errorMessage);
      console.error('Error fetching session data:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Subscribe to session events
  useEffect(() => {
    if (!sessionId || !isConnected) return;

    // Subscribe to this session's events
    socketService.subscribeToSession(sessionId);

    // Session progress updates - debounced
    let progressTimeout: NodeJS.Timeout;
    const unsubscribeProgress = subscribe('session:progress', (progressData: any) => {
      if (progressData.sessionId === sessionId) {
        clearTimeout(progressTimeout);
        progressTimeout = setTimeout(() => {
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              session: {
                ...prev.session,
                ...progressData,
              },
            };
          });
          setLastUpdate(new Date());
        }, 500); // Debounce by 500ms
      }
    });

    // Profile status updates - batched
    let profileUpdates: any[] = [];
    let profileUpdateTimeout: NodeJS.Timeout;
    
    const unsubscribeProfileUpdate = subscribe('profile:statusUpdate', (profileData: any) => {
      if (profileData.sessionId === sessionId) {
        profileUpdates.push(profileData);
        
        clearTimeout(profileUpdateTimeout);
        profileUpdateTimeout = setTimeout(() => {
          const updates = [...profileUpdates];
          profileUpdates = [];
          
          setData(prev => {
            if (!prev) return prev;
            
            // Update depth stats for all batched updates
            const newDepthStats = [...prev.depthStats];
            updates.forEach(update => {
              const depthIndex = newDepthStats.findIndex(d => d.depth === update.depth);
              if (depthIndex !== -1) {
                const depthStat = newDepthStats[depthIndex];
                if (update.status === 'scraped') {
                  depthStat.scraped++;
                  depthStat.pending = Math.max(0, depthStat.pending - 1);
                } else if (update.status === 'failed') {
                  depthStat.failed++;
                  depthStat.pending = Math.max(0, depthStat.pending - 1);
                }
              }
            });

            // Add latest updates to recent profiles
            const newRecentProfiles = [...updates.slice(-10).reverse(), ...prev.recentProfiles].slice(0, 10);

            return {
              ...prev,
              depthStats: newDepthStats,
              recentProfiles: newRecentProfiles,
            };
          });
          setLastUpdate(new Date());
        }, 1000); // Batch updates every second
      }
    });

    // Batch processing updates
    const unsubscribeBatch = subscribe('batch:processing', (batchData: any) => {
      if (batchData.sessionId === sessionId) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBatch: {
              depth: batchData.depth,
              profiles: batchData.currentBatch,
              processedCount: batchData.processedCount,
              totalCount: batchData.totalCount,
            },
          };
        });
        setLastUpdate(new Date());
      }
    });

    // Depth completion events
    const unsubscribeDepthComplete = subscribe('session:depthCompleted', (depthData: any) => {
      if (depthData.sessionId === sessionId) {
        // Refresh full data when a depth is completed
        fetchSessionData();
      }
    });

    // Queue status updates
    const unsubscribeQueue = subscribe('queue:statusUpdate', (queueData: any) => {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          queueStatus: queueData,
        };
      });
    });

    // Initial data fetch
    fetchSessionData();

    // Cleanup
    return () => {
      socketService.unsubscribeFromSession(sessionId);
      clearTimeout(progressTimeout);
      clearTimeout(profileUpdateTimeout);
      unsubscribeProgress();
      unsubscribeProfileUpdate();
      unsubscribeBatch();
      unsubscribeDepthComplete();
      unsubscribeQueue();
    };
  }, [sessionId, isConnected, subscribe, fetchSessionData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  };
}