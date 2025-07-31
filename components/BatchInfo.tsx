import React from 'react';
import { 
  CubeIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface BatchData {
  depth: number;
  profiles: string[];
  processedCount: number;
  totalCount: number;
}

interface BatchInfoProps {
  batch: BatchData;
}

const BatchInfo: React.FC<BatchInfoProps> = ({ batch }) => {
  const progressPercentage = batch.totalCount > 0 
    ? Math.round((batch.processedCount / batch.totalCount) * 100)
    : 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center">
          <CubeIcon className="h-5 w-5 mr-2" />
          Current Batch Processing
        </h2>
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-700">Processing...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Batch Info */}
        <div>
          <p className="text-sm text-blue-700 mb-1">Batch Details</p>
          <div className="bg-white rounded p-3">
            <p className="text-lg font-medium text-gray-900">
              Depth {batch.depth}
            </p>
            <p className="text-sm text-gray-600">
              {batch.profiles.length} profiles in batch
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <p className="text-sm text-blue-700 mb-1">Batch Progress</p>
          <div className="bg-white rounded p-3">
            <p className="text-lg font-medium text-gray-900">
              {batch.processedCount} / {batch.totalCount}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Profiles */}
        <div>
          <p className="text-sm text-blue-700 mb-1">Processing Profiles</p>
          <div className="bg-white rounded p-3 max-h-20 overflow-y-auto">
            <div className="space-y-1">
              {batch.profiles.slice(0, 3).map((profile, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <UserGroupIcon className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-600 truncate">
                    {profile.split('/').pop() || profile}
                  </p>
                </div>
              ))}
              {batch.profiles.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{batch.profiles.length - 3} more...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchInfo;