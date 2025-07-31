import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'text', 
  width = '100%', 
  height,
  className = '',
  count = 1
}) => {
  const getHeight = () => {
    if (height) return height;
    switch (variant) {
      case 'text': return '1rem';
      case 'circular': return width;
      case 'rectangular': return '4rem';
      case 'card': return '10rem';
      default: return '1rem';
    }
  };

  const getStyles = () => {
    const baseStyles = 'animate-pulse bg-gray-200';
    switch (variant) {
      case 'circular':
        return `${baseStyles} rounded-full`;
      case 'card':
        return `${baseStyles} rounded-lg`;
      case 'rectangular':
        return `${baseStyles} rounded`;
      default:
        return `${baseStyles} rounded`;
    }
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${getStyles()} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof getHeight() === 'number' ? `${getHeight()}px` : getHeight(),
      }}
    />
  ));

  return count > 1 ? <>{elements}</> : elements[0];
};

// Preset skeleton components
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }, (_, i) => (
      <LoadingSkeleton 
        key={i} 
        variant="text" 
        width={i === lines - 1 ? '60%' : '100%'} 
      />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <LoadingSkeleton variant="text" width="40%" height="1.5rem" />
      <LoadingSkeleton variant="rectangular" width="4rem" height="1.5rem" />
    </div>
    <TextSkeleton lines={2} />
    <div className="mt-4">
      <LoadingSkeleton variant="rectangular" height="2rem" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }, (_, i) => (
      <td key={i} className="px-6 py-4">
        <LoadingSkeleton variant="text" />
      </td>
    ))}
  </tr>
);

export const ProfileCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center space-x-3">
      <LoadingSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <LoadingSkeleton variant="text" width="60%" className="mb-1" />
        <LoadingSkeleton variant="text" width="40%" height="0.75rem" />
      </div>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="text-center">
          <LoadingSkeleton variant="text" width="100%" height="1.5rem" className="mb-1" />
          <LoadingSkeleton variant="text" width="80%" height="0.75rem" className="mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;