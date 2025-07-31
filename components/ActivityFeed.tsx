import React from 'react';
import { 
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface Activity {
  timestamp: string;
  type: string;
  message: string;
  sessionId?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  onSessionClick?: (sessionId: string) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onSessionClick }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'start':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'pause':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'stop':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      case 'update':
        return <ArrowPathIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <div
              key={index}
              className={`p-4 hover:bg-gray-50 transition-colors ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    {activity.sessionId && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => onSessionClick?.(activity.sessionId!)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View Session
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {activities.length >= 50 && (
        <div className="p-3 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-200">
          Showing last 50 activities
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;