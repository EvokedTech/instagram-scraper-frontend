'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSessionMonitoring } from '@/hooks/useSessionMonitoring';
import { useAnalysisStats } from '@/hooks/useAnalysisStats';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon, 
  PauseIcon, 
  PlayIcon, 
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  NoSymbolIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import DepthProgressCard from '@/components/DepthProgressCard';
import ProfileTable from '@/components/ProfileTable';
import BatchInfo from '@/components/BatchInfo';
import AnalysisStats from '@/components/AnalysisStats';
import api, { sessionAPI } from '@/lib/api';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const { data, loading, error, lastUpdate, refresh, isConnected } = useSessionMonitoring(sessionId);
  const { stats: analysisStats } = useAnalysisStats(sessionId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<number | null>(0); // Default to depth 0
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAction = async (action: 'pause' | 'resume' | 'stop') => {
    try {
      setActionLoading(action);
      await api.post(`/sessions/${sessionId}/${action}`);
      refresh();
    } catch (error) {
      console.error(`Failed to ${action} session:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading('delete');
      await sessionAPI.delete(sessionId);
      router.push('/dashboard/sessions');
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-5 w-5 text-green-500" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'stopped':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'An error occurred'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { 
    session = {}, 
    depthStats = [], 
    currentBatch = null, 
    processingMetrics = {} as any, 
    recentProfiles = [], 
    queueStatus = {} 
  } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {session.name || 'Unnamed Session'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {session.description || 'No description'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Status */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(session.status || 'pending')}
                <span className="text-sm font-medium capitalize">{session.status || 'pending'}</span>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <WifiIcon className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Live</span>
                  </>
                ) : (
                  <>
                    <NoSymbolIcon className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Offline</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              {session.status && session.status === 'running' && (
                <button
                  onClick={() => handleAction('pause')}
                  disabled={actionLoading !== null}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  <PauseIcon className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              )}
              
              {session.status === 'paused' && (
                <button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading !== null}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Resume</span>
                </button>
              )}
              
              {['running', 'paused'].includes(session.status) && (
                <button
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading !== null}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <StopIcon className="h-4 w-4" />
                  <span>Stop</span>
                </button>
              )}

              <button
                onClick={refresh}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Refresh data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading !== null || session.status === 'running'}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={session.status === 'running' ? 'Cannot delete running session' : 'Delete session'}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this session? This action cannot be undone and all associated data will be permanently removed.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'delete' ? 'Deleting...' : 'Delete Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Overview */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <div className="mt-1">
                <div className="flex items-center">
                  <span className="text-lg font-medium">{Math.min(session.progressPercentage || 0, 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(session.progressPercentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">API Cost</p>
              <p className="text-lg font-medium mt-1">
                ${((processingMetrics?.apiCreditsUsed || 0) * 2.3 / 1000).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-lg font-medium mt-1">
                {processingMetrics?.successRate?.toFixed(1) || '100.0'}%
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Stats */}
        <AnalysisStats stats={analysisStats} />

        {/* Current Batch Info */}
        {currentBatch && session.status === 'running' && (
          <BatchInfo batch={currentBatch} />
        )}

        {/* Depth Progress Cards */}
        {depthStats && depthStats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress by Depth</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depthStats.map((depthStat) => (
                <DepthProgressCard
                  key={depthStat.depth}
                  depthStat={depthStat}
                  isActive={selectedDepth === depthStat.depth}
                  onClick={() => setSelectedDepth(depthStat.depth)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Profile Table */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDepth !== null ? `Depth ${selectedDepth} Profiles` : 'All Profiles'}
          </h2>
          <ProfileTable
            sessionId={sessionId}
            depth={selectedDepth || undefined}
            onDepthChange={setSelectedDepth}
          />
        </div>

        {/* Last Update */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}