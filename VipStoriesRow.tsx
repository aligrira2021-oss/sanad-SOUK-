import React from 'react';
import { motion } from 'motion/react';
import { Story } from '../types';
import { Sparkles } from 'lucide-react';

interface VipStoriesRowProps {
  stories: Story[];
  currentUserObj?: any;
  onStoryClick?: (id: string) => void;
  onProfileClick?: () => void;
}

const VipStoriesRow: React.FC<VipStoriesRowProps> = ({ stories, onStoryClick }) => {
  if (!stories.length) return null;

  return (
    <div className="w-full relative bg-black/30 border border-white/5 rounded-3xl py-4 mb-4">
      {/* Small elegant title */}
      <div className="px-4.5 sm:px-6 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-xs font-bold text-gray-200 font-display">قصص النخبة VIP</span>
        </div>
        <span className="text-[10px] text-gray-400">اسحب للمزيد</span>
      </div>

      <div 
        className="flex gap-4.5 overflow-x-auto no-scrollbar px-4.5 sm:px-6 scroll-smooth overscroll-x-contain items-start" 
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {stories.map((story, index) => {
          const isFirst = index === 0;
          return (
            <motion.div
              key={story.id}
              onClick={() => onStoryClick && onStoryClick(story.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 cursor-pointer shrink-0 snap-start w-[72px]"
            >
              {/* Outer border container */}
              <div className={`relative w-[68px] h-[68px] rounded-full p-[2px] transition-all duration-300 ${
                isFirst 
                  ? 'bg-gradient-to-tr from-[#D4AF37] via-yellow-100 to-[#8B6508] shadow-[0_0_15px_rgba(212,175,55,0.5)] ring-2 ring-[#D4AF37]/30' 
                  : story.isVip 
                    ? 'bg-gradient-to-tr from-[#D4AF37] via-yellow-250 to-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.15)]' 
                    : 'bg-gradient-to-tr from-gray-600 via-gray-350 to-gray-600 shadow-sm'
              }`}>
                
                {/* Inner container */}
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0d0d0d] border-[2px] border-[#050505] relative z-10">
                  <img 
                    src={(story as any).imageUrls?.[0] || story.imageUrl || story.sellerAvatar || 'https://via.placeholder.com/150'} 
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                </div>

                {/* VIP small indicator badge */}
                {(story.isVip || isFirst) && (
                   <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-[#D4AF37] to-[#8B6508] text-black text-[8px] font-black px-1.5 py-[1px] border border-[#050505] rounded-full whitespace-nowrap shadow-md flex items-center justify-center leading-none">
                      👑 VIP
                   </div>
                )}
              </div>
              
              <span className="text-[10px] text-gray-300 w-full text-center px-0.5 line-clamp-2 leading-tight font-medium" dir="auto" title={story.title}>
                  {story.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VipStoriesRow);
