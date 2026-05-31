import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { Story } from '../types';

interface StoryViewerModalProps {
  stories: Story[];
  initialStoryId: string;
  onClose: () => void;
  onActionClick: (story: Story) => void;
}

const STORY_DURATION = 5000; // 5 seconds per slide image

export default function StoryViewerModal({ stories, initialStoryId, onClose, onActionClick }: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = stories.findIndex(s => s.id === initialStoryId);
    return Math.max(0, idx);
  });
  
  const [imageIndex, setImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const currentStory = stories[currentIndex];

  // Resolve story slides
  const storyImages = currentStory && currentStory.imageUrls && currentStory.imageUrls.length > 0 
    ? currentStory.imageUrls 
    : currentStory ? [currentStory.imageUrl] : [];

  const handleNext = useCallback(() => {
    if (imageIndex < storyImages.length - 1) {
      setImageIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next story
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setImageIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [currentIndex, imageIndex, stories, storyImages.length, onClose]);

  const handlePrev = useCallback(() => {
    if (imageIndex > 0) {
      setImageIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous story
      if (currentIndex > 0) {
        const prevStory = stories[currentIndex - 1];
        const prevImages = prevStory.imageUrls && prevStory.imageUrls.length > 0 ? prevStory.imageUrls : [prevStory.imageUrl];
        setCurrentIndex(prev => prev - 1);
        setImageIndex(prevImages.length - 1);
        setProgress(0);
      }
    }
  }, [currentIndex, imageIndex, stories]);

  // Reset image index when switching stories manually via prop or external change
  useEffect(() => {
    setImageIndex(0);
    setProgress(0);
  }, [currentIndex]);

  // Timer loop for tracking progress
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 50, STORY_DURATION);
        return next;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [currentIndex, imageIndex, isPaused, currentStory]);

  // Advance on timeout
  useEffect(() => {
    if (progress >= STORY_DURATION) {
      handleNext();
    }
  }, [progress, handleNext]);

  // Preloading all slides of the current story, plus the next story
  useEffect(() => {
    if (!currentStory) return;
    
    // Preload current story's image slide items
    const activeImages = currentStory.imageUrls && currentStory.imageUrls.length > 0 ? currentStory.imageUrls : [currentStory.imageUrl];
    activeImages.forEach(src => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });

    // Preload next story's images
    if (currentIndex < stories.length - 1) {
      const nextStory = stories[currentIndex + 1];
      const nextImages = nextStory.imageUrls && nextStory.imageUrls.length > 0 ? nextStory.imageUrls : [nextStory.imageUrl];
      nextImages.forEach(src => {
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    }
  }, [currentIndex, currentStory, stories]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
     touchStartX.current = e.touches[0].clientX;
     touchStartY.current = e.touches[0].clientY;
     setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
     setIsPaused(false);

     const touchEndX = e.changedTouches[0].clientX;
     const touchEndY = e.changedTouches[0].clientY;
     
     const diffX = touchStartX.current - touchEndX;
     const diffY = touchStartY.current - touchEndY;

     if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipes
        if (diffX > 50) {
            handleNext(); // swipe left -> next slide / next story
        } else if (diffX < -50) {
            handlePrev(); // swipe right -> prev slide / prev story
        }
     } else {
        // Vertical swipe down to close, swipe up for details
        if (diffY < -50) {
            onClose(); // swipe down -> close
        } else if (diffY > 50) {
            onActionClick(currentStory); // swipe up -> open full ad
        }
     }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handlePrev(); // RTL makes ArrowRight Go Prev
      } else if (e.key === 'ArrowLeft') {
        handleNext(); // RTL ArrowLeft Go Next
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden touch-none selection:bg-transparent" style={{ overscrollBehavior: 'none' }}>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full sm:h-[95vh] sm:max-h-[880px] sm:max-w-md mx-auto bg-black flex flex-col cursor-pointer sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        dir="rtl"
      >
        {/* Progress Bars (Instagram Style - ultra thin representing current story's slides) */}
        <div className="absolute top-4 inset-x-0 z-[100] flex gap-1.5 px-5 pointer-events-none" dir="ltr">
          {storyImages.map((_, i) => (
            <div key={i} className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
              {i < imageIndex && <div className="h-full w-full bg-white/95 transition-all" />}
              {i === imageIndex && (
                <div 
                  className="h-full bg-gradient-to-r from-white to-[#D4AF37]" 
                  style={{ width: `${(progress / STORY_DURATION) * 100}%` }}
                />
              )}
              {i > imageIndex && <div className="h-full w-0 bg-white" />}
            </div>
          ))}
        </div>

        {/* Minimal Header */}
        <div className="absolute top-7 inset-x-0 z-50 px-6 py-2 flex items-center justify-between pointer-events-none">
          <div 
            className="flex items-center gap-3 pointer-events-auto cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); onActionClick(currentStory); }}
            onTouchStart={(e) => { e.stopPropagation(); setIsPaused(true); }}
            onTouchEnd={(e) => { e.stopPropagation(); setIsPaused(false); onActionClick(currentStory); }}
          >
            <div className={`w-10 h-10 rounded-full p-[1.5px] shrink-0 ${currentStory.isVip ? 'bg-gradient-to-tr from-[#D4AF37] via-amber-200 to-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]' : 'bg-white/20'}`}>
              <img src={currentStory.sellerAvatar} className="w-full h-full rounded-full object-cover" alt={currentStory.sellerName} />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[13px] tracking-wide text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)]">
                  {currentStory.sellerName}
                </span>
                {currentStory.isVip && (
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)]" />
                )}
              </div>
              <span className="text-[10px] text-white/80 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)] font-light max-w-[200px] truncate">
                {currentStory.title}
              </span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            onTouchStart={(e) => { e.stopPropagation(); }}
            onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity bg-black/25 backdrop-blur-sm rounded-full border border-white/10 active:scale-90"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${currentIndex}-${imageIndex}`}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, x: 80, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -80, scale: 1.02 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
              <img 
                src={storyImages[imageIndex]}
                alt={currentStory.title || 'Ad Image'}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Multi-slide desktop arrows for ease of navigation */}
        <div className="absolute inset-y-0 left-3 z-[60] flex items-center pointer-events-none">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.stopPropagation(); handlePrev(); }}
            className="pointer-events-auto w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 active:scale-95 transition-all opacity-0 sm:opacity-100"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 z-[60] flex items-center pointer-events-none">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.stopPropagation(); handleNext(); }}
            className="pointer-events-auto w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 active:scale-95 transition-all opacity-0 sm:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Touch/Tap areas for mobile navigation */}
        <div 
          className="absolute inset-y-32 right-0 w-1/3 z-30 sm:hidden" 
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); handleNext(); }}
          onClick={(e) => { e.stopPropagation(); handleNext(); }} 
        />
        <div 
          className="absolute inset-y-32 left-0 w-1/3 z-30 sm:hidden" 
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); handlePrev(); }}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
        />

        {/* Minimal Bottom CTA Button */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2, duration: 0.4 }}
           className="absolute bottom-8 inset-x-0 z-[100] flex flex-col items-center gap-1.5 px-6 pointer-events-none"
        >
           <button 
             type="button"
             onClick={(e) => { e.stopPropagation(); onActionClick(currentStory); }} 
             onTouchStart={(e) => { e.stopPropagation(); setIsPaused(true); }}
             onTouchEnd={(e) => { e.stopPropagation(); setIsPaused(false); onActionClick(currentStory); }}
             className="pointer-events-auto w-full max-w-[280px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5DEB3] text-black font-extrabold text-sm shadow-[0_4px_25px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25"
           >
              <Crown className="w-4 h-4 text-black shrink-0" />
              <span>فتح الإعلان الكامل</span>
           </button>
           <div className="flex items-center gap-1 text-[10px] text-white/60">
              <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
              <span>اسحب للأعلى لفتح الإعلان</span>
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
