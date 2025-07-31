'use client'

import { useState, useEffect, useRef } from 'react'
import { dashboardAPI } from '@/lib/api'
import ProfileTableView from '@/components/ProfileTableView'
import { 
  UserGroupIcon, 
  UsersIcon, 
  ChartBarIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'

interface DatabaseStats {
  totalRootProfiles: number
  totalRelatedProfiles: number
  totalProfiles: number
  analyzedProfiles: number
}

interface Profile {
  _id: string
  username: string
  metadata?: any
  type: 'root' | 'related' | 'analyzed'
  depth?: number
  isAnalyzed?: boolean
  parentUsername?: string
  adultContentScore?: number
  storedTag?: string
  createdAt: string
}

interface CacheEntry {
  profiles: Profile[]
  stats: DatabaseStats
  hasMore: boolean
  timestamp: number
}

interface TabCache {
  [key: string]: CacheEntry // key format: "type-page"
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function DashboardOverview() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [tabSwitching, setTabSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileType, setProfileType] = useState<'all' | 'root' | 'related' | 'analyzed'>('root')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentRequestRef = useRef<{ type: string; page: number } | null>(null)
  const cacheRef = useRef<TabCache>({})
  
  useEffect(() => {
    // Check if we have cached data for this view
    const cacheKey = `${profileType}-${page}`
    const cachedData = cacheRef.current[cacheKey]
    const hasCachedData = cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION
    
    // If we have cached data, don't show loading state
    if (hasCachedData) {
      setLoading(false)
      setTabSwitching(false)
    }
    
    // Cancel any pending request when component unmounts or dependencies change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    fetchDatabaseData(abortController.signal)
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [profileType, page])
  
  // Add keyboard shortcut to clear cache (Ctrl/Cmd + Shift + R)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        console.log('Clearing all cache...')
        cacheRef.current = {}
        handleRefresh()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [profileType])
  
  const fetchDatabaseData = async (signal?: AbortSignal) => {
    try {
      // Store current request params
      const requestParams = { type: profileType, page }
      currentRequestRef.current = requestParams
      
      // Create cache key
      const cacheKey = `${profileType}-${page}`
      
      // Check cache first
      const cachedData = cacheRef.current[cacheKey]
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log(`Using cached data for ${cacheKey}`)
        setStats(cachedData.stats)
        setProfiles(cachedData.profiles)
        setHasMore(cachedData.hasMore)
        setError(null)
        setLoading(false)
        setTabSwitching(false)
        setIsUsingCache(true)
        return
      }
      
      // Not using cache for this request
      setIsUsingCache(false)
      
      // Set tabSwitching to true if we're switching tabs (page is 0)
      if (page === 0) {
        setTabSwitching(true)
      }
      setLoading(true)
      
      const response = await dashboardAPI.getDatabaseProfiles({
        type: profileType,
        limit: 20,
        offset: page * 20
      }, signal)
      
      // Check if the request was aborted
      if (signal?.aborted) {
        return
      }
      
      // Double-check this is still the response we want
      // This prevents stale responses from updating the state
      if (currentRequestRef.current?.type !== requestParams.type || 
          currentRequestRef.current?.page !== requestParams.page) {
        console.log('Ignoring stale response', { 
          expected: currentRequestRef.current, 
          received: requestParams 
        })
        return
      }
      
      // Cache the response
      cacheRef.current[cacheKey] = {
        profiles: response.data.profiles,
        stats: response.data.statistics,
        hasMore: response.data.pagination.hasMore,
        timestamp: Date.now()
      }
      
      // Only update state if this is still the current profile type
      // This prevents race conditions where an old request completes after a new one
      setStats(response.data.statistics)
      setProfiles(response.data.profiles)
      setHasMore(response.data.pagination.hasMore)
      setError(null)
    } catch (err: any) {
      // Ignore abort errors - these are expected when switching tabs/pages
      if (err.isCanceled || err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED') {
        return
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch database profiles'
      setError(errorMessage)
      console.error('Database fetch error:', err)
    } finally {
      // Only set loading to false if not aborted
      if (!signal?.aborted) {
        setLoading(false)
        setTabSwitching(false)
      }
    }
  }
  
  const handleRefresh = () => {
    // Clear cache for current tab to force fresh data
    const cacheKey = `${profileType}-${page}`
    delete cacheRef.current[cacheKey]
    
    // If on page 0, clear all pages for this type
    if (page === 0) {
      Object.keys(cacheRef.current).forEach(key => {
        if (key.startsWith(`${profileType}-`)) {
          delete cacheRef.current[key]
        }
      })
    }
    
    setPage(0)
    // Will trigger useEffect which will handle the fetch with proper AbortController
  }
  
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all scraped Instagram profiles across all sessions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isUsingCache && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Using cached data</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            title="Refresh data (Ctrl+Shift+R to clear all cache)"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Root Profiles</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.totalRootProfiles?.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Related Profiles</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.totalRelatedProfiles?.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Analyzed Profiles</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.analyzedProfiles?.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Profiles</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.totalProfiles?.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => { setProfileType('root'); setPage(0); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                profileType === 'root'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Root Profiles
            </button>
            <button
              onClick={() => { setProfileType('related'); setPage(0); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                profileType === 'related'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Related Profiles
            </button>
            <button
              onClick={() => { setProfileType('analyzed'); setPage(0); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                profileType === 'analyzed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analyzed Profiles
            </button>
          </nav>
        </div>
        
        {/* Profile Table */}
        <div className="p-6">
          <ProfileTableView profiles={profiles} loading={loading || tabSwitching} />
          
          {/* Pagination */}
          {profiles.length > 0 && !tabSwitching && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}