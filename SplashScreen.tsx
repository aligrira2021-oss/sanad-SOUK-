import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fast, professional startup - no artificial delays
    const timer = setTimeout(() => {
      setIsVisible(false);
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 500); // 500ms fade transition
      return () => clearTimeout(finishTimer);
    }, 1200); // 1.2s visibility

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }}
          className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center m-0 overflow-hidden select-none w-screen h-screen"
          style={{ direction: 'rtl', touchAction: 'none' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6"
          >
            {/* Minimalist Premium Logo */}
            <div className="flex flex-col items-center gap-2">
               <span className="text-[42px] sm:text-[56px] font-black font-display tracking-tight text-white flex items-center justify-center select-none drop-shadow-2xl">
                  سوق <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-transparent bg-clip-text mr-2 animate-pulse-slow">سند</span>
               </span>
               <span className="text-gray-400 text-sm sm:text-base font-medium tracking-wide mt-2">
                 تجربة تسوق بثقة واحترافية
               </span>
            </div>

            {/* Subtle Loading Element */}
            <div className="mt-12 flex flex-col items-center gap-3">
               <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin opacity-80" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
