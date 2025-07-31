import React from 'react';
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Profile {
  _id: string;
  username: string;
  metadata?: {
    fullName?: string;
    profilePicUrl?: string;
    followersCount?: number;
    followsCount?: number;
    postsCount?: number;
    biography?: string;
    isVerified?: boolean;
    engagementRate?: number;
    contentType?: string[];
  };
  type: 'root' | 'related' | 'analyzed';
  depth?: number;
  isAnalyzed?: boolean;
  parentUsername?: string;
  adultContentScore?: number;
  storedTag?: string;
  createdAt: string;
}

interface ProfileTableViewProps {
  profiles: Profile[];
  loading?: boolean;
}

const ProfileTableView: React.FC<ProfileTableViewProps> = ({ profiles, loading }) => {
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'root':
        return 'bg-purple-100 text-purple-800';
      case 'related':
        return 'bg-blue-100 text-blue-800';
      case 'analyzed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-2 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-500">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No profiles found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profile
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Followers
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Following
            </th>
            {profiles.length > 0 && profiles[0].type === 'root' ? (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posts
              </th>
            ) : (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent Username
              </th>
            )}
            {profiles.some(p => p.type === 'analyzed') && (
              <>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adult Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
              </>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {profiles.map((profile) => (
            <tr key={profile._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={profile.metadata?.profilePicUrl || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
                      alt={profile.username}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-1">
                      <div className="text-sm font-medium text-gray-900">
                        @{profile.username}
                      </div>
                      {profile.metadata?.isVerified && (
                        <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    {profile.metadata?.fullName && (
                      <div className="text-sm text-gray-500">
                        {profile.metadata.fullName}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(profile.type)}`}>
                    {profile.type === 'root' ? 'Root' : profile.type === 'analyzed' ? (profile.storedTag || 'Analyzed') : `Depth ${profile.depth || 0}`}
                  </span>
                  {profile.isAnalyzed && profile.type !== 'analyzed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Analyzed
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                {formatNumber(profile.metadata?.followersCount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                {formatNumber(profile.metadata?.followsCount)}
              </td>
              {profiles.length > 0 && profiles[0].type === 'root' ? (
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {formatNumber(profile.metadata?.postsCount)}
                </td>
              ) : (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.parentUsername ? `@${profile.parentUsername}` : '-'}
                </td>
              )}
              {profiles.some(p => p.type === 'analyzed') && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {profile.type === 'analyzed' && profile.adultContentScore !== undefined ? 
                      `${profile.adultContentScore.toFixed(2)}` : 
                      '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {profile.type === 'analyzed' && profile.metadata?.engagementRate ? 
                      `${profile.metadata.engagementRate.toFixed(2)}%` : 
                      '-'
                    }
                  </td>
                </>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(profile.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <a
                  href={`https://instagram.com/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-900"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 inline" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfileTableView;