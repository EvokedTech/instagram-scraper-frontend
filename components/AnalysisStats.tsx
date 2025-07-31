import React from 'react';
import {
  BeakerIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

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
  queueStats?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

interface AnalysisStatsProps {
  stats: AnalysisStats | null;
}

export default function AnalysisStats({ stats }: AnalysisStatsProps) {
  if (!stats) return null;

  // Handle both new n8nQueueStats and legacy queueStats
  const queueStats = stats.n8nQueueStats || stats.queueStats || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    total: 0
  };

  const totalInQueue = (queueStats.waiting || 0) + (queueStats.active || 0);
  const totalAnalyzed = stats.totalAnalyzed || 0;
  const totalPendingAnalysis = stats.totalPendingAnalysis || 0;
  const percentComplete = stats.percentComplete || 0;

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BeakerIcon className="h-5 w-5 mr-2 text-purple-600" />
          n8n Analysis Progress
        </h2>
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600">n8n Webhook Active</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Total Analyzed</p>
              <p className="text-2xl font-bold text-purple-900">{totalAnalyzed}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Pending Analysis</p>
              <p className="text-2xl font-bold text-blue-900">{totalPendingAnalysis}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Stored (Adult)</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalStored || 0}</p>
              <p className="text-xs text-green-600 mt-1">Score &gt; 30</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Skipped</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalSkipped || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Score ≤ 30</p>
            </div>
            <ExclamationCircleIcon className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Queue Status */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">n8n Queue Status</h3>
        <div className="flex space-x-4 flex-wrap">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Waiting: {queueStats.waiting || 0}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Active: {queueStats.active || 0}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Completed: {queueStats.completed || 0}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Failed: {queueStats.failed || 0}</span>
          </div>
          {'delayed' in queueStats && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Delayed: {(queueStats as any).delayed || 0}</span>
            </div>
          )}
        </div>
      </div>

      {/* Adult Content Score Statistics */}
      {stats.breakdown && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Adult Content Score Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Average Score</p>
              <p className="text-lg font-semibold text-gray-900">{stats.breakdown.adultContentStats.average}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Min Score</p>
              <p className="text-lg font-semibold text-gray-900">{stats.breakdown.adultContentStats.min}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Max Score</p>
              <p className="text-lg font-semibold text-gray-900">{stats.breakdown.adultContentStats.max}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Threshold</p>
              <p className="text-lg font-semibold text-gray-900">&gt; {stats.breakdown.adultContentStats.threshold}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Analysis Progress</span>
          <span>{totalAnalyzed} / {totalAnalyzed + totalPendingAnalysis}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}