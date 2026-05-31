import React from 'react';

interface EmptyStateProps {
  icon: any;
  title: string;
  desc: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ icon: Icon, title, desc }) => (
    <div className="bg-gray-900/40 border border-[#1f2937]/50 rounded-2xl p-6 py-16 flex flex-col items-center justify-center text-center max-w-xs sm:max-w-sm mx-auto w-full">
      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 border border-gray-800">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-white font-bold mb-2 text-lg">{title}</h3>
      <p className="text-gray-400 max-w-[240px] text-sm leading-relaxed">{desc}</p>
    </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;
