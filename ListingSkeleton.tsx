import React from 'react';

const ListingSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-[#121212] border border-gray-800/50 rounded-2xl p-4 flex gap-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        <div className="w-32 h-32 bg-gray-900 rounded-xl shrink-0" />
        <div className="flex-1 py-2 space-y-4">
          <div className="h-4 bg-gray-900 rounded w-3/4" />
          <div className="h-3 bg-gray-900 rounded w-1/2" />
          <div className="h-6 bg-gray-900 rounded w-1/4 mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-gray-800/50 rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-10 pointer-events-none" />
      <div className="relative aspect-[4/5] bg-gray-900" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-900 rounded w-3/4" />
        <div className="h-3 bg-gray-900 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
           <div className="h-5 bg-gray-900 rounded w-1/3" />
           <div className="h-6 w-6 bg-gray-900 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ListingSkeleton;
