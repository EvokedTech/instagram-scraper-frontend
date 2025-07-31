import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  BoltIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ProcessingMetrics {
  processingRate: number;
  averageTimePerProfile: number;
  estimatedTimeRemaining: string;
  apiCreditsUsed: number;
  successRate: number;
}

interface ProcessingMetricsProps {
  metrics: ProcessingMetrics;
}

const ProcessingMetrics: React.FC<ProcessingMetricsProps> = ({ metrics }) => {
  // Provide default values for all metrics
  const safeMetrics = {
    processingRate: metrics?.processingRate || 0,
    averageTimePerProfile: metrics?.averageTimePerProfile || 0,
    estimatedTimeRemaining: metrics?.estimatedTimeRemaining || 'Calculating...',
    apiCreditsUsed: metrics?.apiCreditsUsed || 0,
    successRate: metrics?.successRate || 0
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ChartBarIcon className="h-5 w-5 mr-2" />
        Processing Metrics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Processing Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BoltIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {safeMetrics.processingRate.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">Profiles/min</p>
        </div>

        {/* Average Time */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {safeMetrics.averageTimePerProfile.toFixed(1)}s
          </p>
          <p className="text-sm text-gray-500">Avg Time/Profile</p>
        </div>

        {/* ETA */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {safeMetrics.estimatedTimeRemaining}
          </p>
          <p className="text-sm text-gray-500">Est. Time Remaining</p>
        </div>

        {/* API Credits */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {safeMetrics.apiCreditsUsed.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">API Credits Used</p>
        </div>

        {/* Success Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {safeMetrics.successRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Success Rate</p>
        </div>
      </div>

      {/* Progress Bar for Success Rate */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              safeMetrics.successRate >= 90 ? 'bg-green-500' :
              safeMetrics.successRate >= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${safeMetrics.successRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProcessingMetrics;