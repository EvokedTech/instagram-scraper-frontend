import React from 'react';
import { 
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SystemHealth {
  mongodb: boolean;
  redis: boolean;
  api: boolean;
  lastChecked: string;
}

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ systemHealth }) => {
  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircleIcon className="h-6 w-6 text-green-500" />
    ) : (
      <XCircleIcon className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Operational' : 'Down';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const allSystemsOperational = systemHealth.mongodb && systemHealth.redis && systemHealth.api;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          allSystemsOperational 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {allSystemsOperational ? 'All Systems Operational' : 'Issues Detected'}
        </div>
      </div>

      <div className="space-y-4">
        {/* MongoDB Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CircleStackIcon className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">MongoDB</p>
              <p className="text-sm text-gray-500">Database Service</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemHealth.mongodb)}
            <span className={`text-sm font-medium ${getStatusColor(systemHealth.mongodb)}`}>
              {getStatusText(systemHealth.mongodb)}
            </span>
          </div>
        </div>

        {/* Redis Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Redis</p>
              <p className="text-sm text-gray-500">Queue Service</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemHealth.redis)}
            <span className={`text-sm font-medium ${getStatusColor(systemHealth.redis)}`}>
              {getStatusText(systemHealth.redis)}
            </span>
          </div>
        </div>

        {/* API Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Scraping API</p>
              <p className="text-sm text-gray-500">External Service</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemHealth.api)}
            <span className={`text-sm font-medium ${getStatusColor(systemHealth.api)}`}>
              {getStatusText(systemHealth.api)}
            </span>
          </div>
        </div>
      </div>

      {/* Last Checked */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          Last checked: {new Date(systemHealth.lastChecked).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;