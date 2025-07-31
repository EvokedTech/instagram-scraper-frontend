import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ProfileCardProps {
  profile: {
    username: string;
    metadata?: {
      fullName?: string;
      profilePicUrl?: string;
      followersCount?: number;
      followsCount?: number;
      postsCount?: number;
      biography?: string;
      isVerified?: boolean;
    };
    type: 'root' | 'related';
    depth?: number;
    isAnalyzed?: boolean;
    createdAt: string;
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const { username, metadata, type, depth, isAnalyzed } = profile;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Profile Header */}
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={metadata?.profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=random`}
              alt={username}
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                @{username}
              </h3>
              {metadata?.isVerified && (
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {metadata?.fullName && (
              <p className="text-xs text-gray-600 truncate">{metadata.fullName}</p>
            )}
            
            {/* Type Badge */}
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                type === 'root' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {type === 'root' ? 'Root' : `Depth ${depth}`}
              </span>
              {isAnalyzed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Analyzed
                </span>
              )}
            </div>
          </div>
          
          {/* Visit Link */}
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </a>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded px-2 py-1">
            <p className="text-xs text-gray-500">Followers</p>
            <p className="text-sm font-semibold text-gray-900">
              {metadata?.followersCount ? 
                (metadata.followersCount >= 1000000 ? 
                  `${(metadata.followersCount / 1000000).toFixed(1)}M` : 
                  metadata.followersCount >= 1000 ? 
                    `${(metadata.followersCount / 1000).toFixed(1)}K` : 
                    metadata.followersCount.toLocaleString()
                ) : '0'
              }
            </p>
          </div>
          <div className="bg-gray-50 rounded px-2 py-1">
            <p className="text-xs text-gray-500">Following</p>
            <p className="text-sm font-semibold text-gray-900">
              {metadata?.followsCount ? 
                (metadata.followsCount >= 1000 ? 
                  `${(metadata.followsCount / 1000).toFixed(1)}K` : 
                  metadata.followsCount.toLocaleString()
                ) : '0'
              }
            </p>
          </div>
          <div className="bg-gray-50 rounded px-2 py-1">
            <p className="text-xs text-gray-500">Posts</p>
            <p className="text-sm font-semibold text-gray-900">
              {metadata?.postsCount?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* Biography */}
        {metadata?.biography && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 line-clamp-2">{metadata.biography}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;