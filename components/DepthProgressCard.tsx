import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  CircleStackIcon,
  ArrowDownTrayIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';

interface DepthStats {
  depth: number;
  total: number;
  scraped: number;
  failed: number;
  pending: number;
  inQueue: number;
  fromDatabase: number;
  needToScrape: number;
  totalRelatedProfilesFound?: number;
  existingProfiles?: number;
  actuallyScraped?: number;
  analyzedProfiles?: number;
  pendingAnalysis?: number;
  isScrapingComplete?: boolean;
  isAnalysisComplete?: boolean;
  isFullyComplete?: boolean;
}

interface DepthProgressCardProps {
  depthStat: DepthStats;
  isActive: boolean;
  onClick: () => void;
}

const DepthProgressCard: React.FC<DepthProgressCardProps> = ({ depthStat, isActive, onClick }) => {
  // Calculate scraping progress
  const scrapingProgress = depthStat.total > 0 
    ? Math.round(((depthStat.scraped + depthStat.failed) / depthStat.total) * 100)
    : 0;
    
  // Calculate analysis progress (only for depths > 0)
  const analysisProgress = depthStat.depth > 0 && depthStat.scraped > 0
    ? Math.round(((depthStat.analyzedProfiles || 0) / depthStat.scraped) * 100)
    : depthStat.depth === 0 ? 100 : 0; // Depth 0 doesn't need analysis
    
  // Overall progress (50% scraping, 50% analysis)
  const overallProgress = depthStat.depth === 0 
    ? scrapingProgress // Depth 0 only has scraping
    : Math.round((scrapingProgress * 0.5) + (analysisProgress * 0.5));

  const getProgressColor = () => {
    if (depthStat.isFullyComplete) return 'bg-green-500';
    if (depthStat.failed > 0 && depthStat.failed >= depthStat.scraped) return 'bg-red-500';
    if (overallProgress > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Depth {depthStat.depth}
          {depthStat.depth === 0 && ' (Root)'}
        </h3>
        {isActive && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{overallProgress}% Complete</span>
          {depthStat.isFullyComplete && (
            <span className="text-green-600 font-medium">✓ Completed</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Scraped</p>
            <p className="text-sm font-medium">{depthStat.scraped}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <XCircleIcon className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-gray-500">Failed</p>
            <p className="text-sm font-medium">{depthStat.failed}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-sm font-medium">{depthStat.pending}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <QueueListIcon className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">In Queue</p>
            <p className="text-sm font-medium">{depthStat.inQueue}</p>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <CircleStackIcon className="h-3 w-3 text-gray-400" />
            <span className="text-gray-500">From DB:</span>
            <span className="font-medium">{depthStat.fromDatabase}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-3 w-3 text-gray-400" />
            <span className="text-gray-500">To Scrape:</span>
            <span className="font-medium">{depthStat.needToScrape}</span>
          </div>
        </div>
      </div>

      {/* Analysis Stats (only for depths > 0) */}
      {depthStat.depth > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Analysis Status</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="h-3 w-3 text-purple-500" />
              <span className="text-gray-500">Analyzed:</span>
              <span className="font-medium text-purple-600">{depthStat.analyzedProfiles || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3 text-purple-400" />
              <span className="text-gray-500">Pending:</span>
              <span className="font-medium">{depthStat.pendingAnalysis || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Discovery Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Profile Discovery</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Related Profiles Found:</span>
            <span className="text-sm font-semibold text-blue-600">
              {depthStat.totalRelatedProfilesFound || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Already in Database:</span>
            <span className="text-sm font-semibold text-green-600">
              {depthStat.existingProfiles || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Actually Scraped:</span>
            <span className="text-sm font-semibold text-purple-600">
              {depthStat.actuallyScraped || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepthProgressCard;