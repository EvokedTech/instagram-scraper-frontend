import React, { useState, useEffect } from 'react';
import { useProfileList } from '@/hooks/useProfileList';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface ProfileTableProps {
  sessionId: string;
  depth?: number;
  onDepthChange?: (depth: number | null) => void;
}

const ProfileTable: React.FC<ProfileTableProps> = ({ sessionId, depth, onDepthChange }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const { 
    profiles, 
    totalCount, 
    totalPages, 
    loading, 
    error,
    isTransitioning, 
    refresh,
    isConnected 
  } = useProfileList({
    sessionId,
    depth,
    status: statusFilter,
    search,
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Reset page when filters change
  useEffect(() => {
    // Debounce search changes
    const searchTimer = setTimeout(() => {
      setPage(1);
    }, search ? 300 : 0);
    
    return () => clearTimeout(searchTimer);
  }, [search]);
  
  // Reset page immediately for other filters
  useEffect(() => {
    setPage(1);
  }, [depth, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scraped':
      case 'analyzed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scraped': return 'Scraped';
      case 'analyzed': return 'Analyzed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '-';
    return num.toLocaleString();
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Error loading profiles: {error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow relative">
      {/* Loading Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10 rounded-lg pointer-events-none">
          <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg shadow-sm">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-700">Loading profiles...</span>
          </div>
        </div>
      )}
      
      {/* Header with Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className={`px-3 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? 'Live Updates' : 'Offline'}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDownIcon className={`h-4 w-4 transform transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="scraped">Scraped</option>
                  <option value="analyzed">Analyzed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Depth Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depth
                </label>
                <select
                  value={depth ?? ''}
                  onChange={(e) => onDepthChange?.(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Depths</option>
                  <option value="0">Depth 0 (Root)</option>
                  <option value="1">Depth 1</option>
                  <option value="2">Depth 2</option>
                  <option value="3">Depth 3</option>
                  <option value="4">Depth 4</option>
                  <option value="5">Depth 5</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ contain: 'layout', willChange: 'transform' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Depth
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Followers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scraped At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && profiles.length === 0 && !isTransitioning ? (
              // Show skeleton rows only on initial load
              [...Array(5)].map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                </tr>
              ))
            ) : profiles.length === 0 && !isTransitioning ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No profiles found
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                          <span>@{profile.username}</span>
                          {profile.profileData?.verified && (
                            <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                          )}
                          {profile.profileData?.isPrivate && (
                            <LockClosedIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        {profile.profileData?.fullName && (
                          <div className="text-sm text-gray-500">
                            {profile.profileData.fullName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      Depth {profile.depth}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(profile.status)}
                      <span className="text-sm text-gray-900">
                        {getStatusText(profile.status)}
                      </span>
                    </div>
                    {profile.error && (
                      <p className="text-xs text-red-600 mt-1">{profile.error}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(profile.profileData?.followersCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(profile.profileData?.postsCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.scrapedAt 
                      ? new Date(profile.scrapedAt).toLocaleString()
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>View</span>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} profiles
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (page <= 3) {
                    pageNum = idx + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = page - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTable;