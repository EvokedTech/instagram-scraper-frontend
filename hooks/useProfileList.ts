import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { api } from '@/lib/api';
import axios from 'axios';

interface Profile {
  _id: string;
  username: string;
  profileUrl: string;
  depth: number;
  status: 'pending' | 'scraped' | 'analyzed' | 'failed';
  profileData?: {
    fullName?: string;
    followersCount?: number;
    followsCount?: number;
    postsCount?: number;
    verified?: boolean;
    isPrivate?: boolean;
  };
  error?: string;
  createdAt: string;
  scrapedAt?: string;
}

interface ProfileListOptions {
  sessionId: string;
  depth?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProfileListData {
  profiles: Profile[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useProfileList(options: ProfileListOptions) {
  const { isConnected, subscribe } = useWebSocket();
  const [data, setData] = useState<ProfileListData>({
    profiles: [],
    totalCount: 0,
    page: 1,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const profileMapRef = useRef<Map<string, Profile>>(new Map());
  const profileCacheRef = useRef<Map<string, ProfileListData>>(new Map());
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key based on filter options
  const getCacheKey = useCallback(() => {
    return `${options.sessionId}-depth-${options.depth || 'all'}-status-${options.status || 'all'}-page-${options.page || 1}`;
  }, [options.sessionId, options.depth, options.status, options.page]);

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (options.depth !== undefined) params.append('depth', options.depth.toString());
    if (options.status) params.append('status', options.status);
    if (options.search) params.append('search', options.search);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    return params.toString();
  }, [options]);

  // Fetch profiles from API
  const fetchProfiles = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    if (!options.sessionId) return;

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    const cacheKey = getCacheKey();
    
    // Check cache first if not forcing refresh and not showing loading state
    if (!forceRefresh && !showLoadingState && !options.search) {
      const cached = profileCacheRef.current.get(cacheKey);
      if (cached) {
        setData(cached);
        setIsTransitioning(false);
        return;
      }
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Only show loading on initial fetch or explicit refresh
      if (showLoadingState) {
        setLoading(true);
      } else {
        setIsTransitioning(true);
      }
      setError(null);
      
      const queryString = buildQueryParams();
      const response = await api.get(
        `/dashboard/session/${options.sessionId}/profiles?${queryString}`,
        { signal: abortController.signal }
      );
      
      // Handle different response structures
      const responseData = response.data?.data || response.data;
      const profiles = responseData?.profiles || [];
      const pagination = responseData?.pagination || {};
      
      // Log for debugging
      if (!Array.isArray(profiles)) {
        console.warn('Profiles is not an array:', profiles);
      }
      
      // Update profile map for efficient updates
      profileMapRef.current.clear();
      if (Array.isArray(profiles)) {
        profiles.forEach((profile: Profile) => {
          profileMapRef.current.set(profile.profileUrl, profile);
        });
      }
      
      const newData = {
        profiles: profiles,
        totalCount: pagination.totalCount || pagination.total || 0,
        page: pagination.page || Math.floor((pagination.offset || 0) / (pagination.limit || 50)) + 1,
        totalPages: pagination.totalPages || pagination.pages || Math.ceil((pagination.total || 0) / (pagination.limit || 50)),
        hasMore: pagination.hasMore !== undefined ? 
          pagination.hasMore : 
          (pagination.page || 1) < (pagination.totalPages || 1),
      };
      
      setData(newData);
      
      // Cache the data if not searching
      if (!options.search) {
        profileCacheRef.current.set(cacheKey, newData);
      }
    } catch (err: any) {
      // Don't set error for aborted requests
      if (!axios.isCancel(err) && err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.error || 'Failed to fetch profiles');
        console.error('Error fetching profiles:', err);
      }
    } finally {
      // Only update loading states if the request wasn't aborted
      if (abortController === abortControllerRef.current) {
        if (showLoadingState) {
          setLoading(false);
        }
        setIsTransitioning(false);
      }
    }
  }, [options.sessionId, options.search, buildQueryParams, getCacheKey]);

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!options.sessionId || !isConnected) return;

    // Profile status updates
    const unsubscribeProfileUpdate = subscribe('profile:statusUpdate', (profileData: any) => {
      if (profileData.sessionId === options.sessionId) {
        // Check if this profile matches our filters
        const matchesDepth = options.depth === undefined || profileData.depth === options.depth;
        const matchesStatus = !options.status || profileData.status === options.status;
        
        if (matchesDepth && matchesStatus) {
          setData(prev => {
            const existingProfile = profileMapRef.current.get(profileData.profileUrl);
            
            if (existingProfile) {
              // Update existing profile
              const updatedProfile = {
                ...existingProfile,
                status: profileData.status,
                error: profileData.error,
                scrapedAt: profileData.status === 'scraped' ? new Date().toISOString() : existingProfile.scrapedAt,
              };
              
              profileMapRef.current.set(profileData.profileUrl, updatedProfile);
              
              const updatedData = {
                ...prev,
                profiles: prev.profiles.map(p => 
                  p.profileUrl === profileData.profileUrl ? updatedProfile : p
                ),
              };
              
              // Update cache with new data
              const cacheKey = getCacheKey();
              if (!options.search) {
                profileCacheRef.current.set(cacheKey, updatedData);
              }
              
              return updatedData;
            } else if (prev.profiles.length < (options.limit || 20)) {
              // Add new profile if we have room on this page
              const newProfile: Profile = {
                _id: profileData._id || Date.now().toString(),
                username: profileData.username,
                profileUrl: profileData.profileUrl,
                depth: profileData.depth,
                status: profileData.status,
                error: profileData.error,
                createdAt: new Date().toISOString(),
                scrapedAt: profileData.status === 'scraped' ? new Date().toISOString() : undefined,
              };
              
              profileMapRef.current.set(profileData.profileUrl, newProfile);
              
              const updatedData = {
                ...prev,
                profiles: [...prev.profiles, newProfile],
                totalCount: prev.totalCount + 1,
              };
              
              // Update cache with new data
              const cacheKey = getCacheKey();
              if (!options.search) {
                profileCacheRef.current.set(cacheKey, updatedData);
              }
              
              return updatedData;
            }
            
            return prev;
          });
        }
      }
    });

    // Profile scraped with full data
    const unsubscribeProfileScraped = subscribe('profile:scraped', (profileData: any) => {
      if (profileData.sessionId === options.sessionId) {
        const existingProfile = profileMapRef.current.get(profileData.profileUrl);
        
        if (existingProfile) {
          setData(prev => {
            const updatedProfile = {
              ...existingProfile,
              status: 'scraped' as const,
              profileData: profileData.profileData,
              scrapedAt: new Date().toISOString(),
            };
            
            profileMapRef.current.set(profileData.profileUrl, updatedProfile);
            
            const updatedData = {
              ...prev,
              profiles: prev.profiles.map(p => 
                p.profileUrl === profileData.profileUrl ? updatedProfile : p
              ),
            };
            
            // Update cache with new data
            const cacheKey = getCacheKey();
            if (!options.search) {
              profileCacheRef.current.set(cacheKey, updatedData);
            }
            
            return updatedData;
          });
        }
      }
    });

    // Initial fetch with loading state
    fetchProfiles(true);

    // Cleanup
    return () => {
      unsubscribeProfileUpdate();
      unsubscribeProfileScraped();
    };
  }, [options.sessionId, isConnected, subscribe, fetchProfiles, getCacheKey, options.search]);

  // Track if this is the initial mount
  useEffect(() => {
    isMountedRef.current = false;
    return () => {
      isMountedRef.current = true;
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle filter changes without showing loading state
  useEffect(() => {
    if (!options.sessionId) return;
    
    // Skip the very first mount - let the other effect handle initial load
    if (isMountedRef.current) {
      return;
    }
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Add a small debounce for rapid changes
    debounceTimerRef.current = setTimeout(() => {
      fetchProfiles(false);
    }, 100);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [options.depth, options.status, options.limit, options.page, fetchProfiles, options.sessionId]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchProfiles(true, true); // Show loading state and force refresh
  }, [fetchProfiles]);

  // Load more profiles (pagination)
  const loadMore = useCallback(() => {
    if (!data.hasMore || loading) return;
    
    // This would typically update the options.page and trigger a re-fetch
    // The parent component should handle pagination state
  }, [data.hasMore, loading]);

  return {
    profiles: data.profiles,
    totalCount: data.totalCount,
    page: data.page,
    totalPages: data.totalPages,
    hasMore: data.hasMore,
    loading,
    error,
    isTransitioning,
    refresh,
    loadMore,
    isConnected,
  };
}