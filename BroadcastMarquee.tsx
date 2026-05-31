import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Flame, Sparkles } from 'lucide-react';

export interface BroadcastMessage {
  id: string;
  sellerName: string;
  location: string;
  title: string;
  plan: 'vip' | 'bronze' | 'free';
  avatar?: string;
  category?: string;
  createdAt?: string;
}

interface BroadcastMarqueeProps {
  queue: BroadcastMessage[];
  onDismiss: (id: string) => void;
}

export default function BroadcastMarquee({ queue, onDismiss }: BroadcastMarqueeProps) {
  const [current, setCurrent] = useState<BroadcastMessage | null>(null);
  const [iteration, setIteration] = useState(0);

  // We load the view counts from localStorage to persist them across sessions
  const [viewCounts, setViewCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sanad_broadcast_views');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Pick the next message when the current one is finished
  useEffect(() => {
    if (queue.length > 0) {
      // Find the first message that hasn't reached its max views (e.g., 10)
      const pendingMessage = queue.find(msg => (viewCounts[msg.id] || 0) < 10);
      if (pendingMessage) {
        if (current?.id !== pendingMessage.id) {
          setCurrent(pendingMessage);
          setIteration(0);
        }
      } else {
        setCurrent(null);
      }
    } else {
      setCurrent(null);
    }
  }, [queue, current?.id, viewCounts]);

  const handleNext = () => {
    if (current) {
      const newCount = (viewCounts[current.id] || 0) + 1;
      const updatedCounts = { ...viewCounts, [current.id]: newCount };
      
      setViewCounts(updatedCounts);
      try {
        localStorage.setItem('sanad_broadcast_views', JSON.stringify(updatedCounts));
      } catch (e) {
        console.error('Failed to save broadcast view count', e);
      }

      if (newCount >= 10) {
        setCurrent(null); // Instantly hide
        onDismiss(current.id);
      } else {
        // Just increment iteration to restart inner animation cleanly without removing outer bar
        setIteration(prev => prev + 1);
      }
    }
  };

  const handleAnimationComplete = () => {
    handleNext();
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="marquee-bar"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-9 bg-gradient-to-r from-[#200202] via-[#8B0000] to-[#200202] border-b border-[#D4AF37]/35 flex items-center overflow-hidden select-none fixed top-0 left-0 right-0 z-50 shadow-[0_2px_12px_rgba(239,68,68,0.25)]"
          dir="rtl"
        >
          {/* Animated subtle gold light beam */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />

          {/* Scrolling text wrapper */}
          <div className="relative w-full h-full flex items-center overflow-hidden">
            <motion.div
              key={`${current.id}-${iteration}`}
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{
                ease: 'linear',
                duration: 18, // Extra smooth and slower elegant speed
              }}
              onAnimationComplete={handleAnimationComplete}
              className="absolute whitespace-nowrap text-white font-medium text-xs sm:text-sm flex items-center gap-3 px-6"
            >
              <div className="inline-flex items-center gap-1.5 shrink-0">
                {current.plan === 'vip' ? (
                  <span className="bg-[#D4AF37] text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    <Crown className="w-2.5 h-2.5 fill-black" />
                    VIP
                  </span>
                ) : current.plan === 'bronze' ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-500/20">
                    <Flame className="w-2.5 h-2.5 fill-amber-300" />
                    متميز
                  </span>
                ) : (
                  <span className="bg-white/10 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    إعلان مميز
                  </span>
                )}
              </div>

              <span className="text-gray-200">
                <span className="text-[#D4AF37] font-bold">{current.sellerName}</span> من <span className="text-gray-300 font-medium">{current.location}</span> ؛ أعلن عن: <span className="text-white font-semibold">{current.title}</span> 👑
              </span>

              <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse shrink-0" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
