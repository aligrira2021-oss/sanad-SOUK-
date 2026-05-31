import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Crown } from 'lucide-react';

interface PublishingTransitionProps {
  plan: 'free' | 'bronze' | 'vip';
}

export default function PublishingTransition({ plan }: PublishingTransitionProps) {
  const isVip = plan === 'vip';
  const isBronze = plan === 'bronze';

  let title = 'جاري المعالجة...';
  let desc = 'جاري بث وتحديث منصة المعروضات الحصرية';
  let accentColor = 'text-emerald-400';
  let glowColor = 'bg-emerald-500/20';

  if (isVip) {
    title = 'بث الإعلان الملكي VIP';
    desc = 'جاري إطلاق إعلانكم الخاص في صدارة المعروضات مع البوق الإعلامي الشامل...';
    accentColor = 'text-[#D4AF37]';
    glowColor = 'bg-[#D4AF37]/20';
  } else if (isBronze) {
    title = 'تحميل الإعلان المميز';
    desc = 'جاري رفع إعلانك البرونزي وتنشيط خوارزميات الترويج والصدارة...';
    accentColor = 'text-slate-300';
    glowColor = 'bg-slate-400/20';
  } else {
    title = 'جاري النشر وتحديث المعرض';
    desc = 'نقوم الآن بإعداد تفاصيل إعلانك وإعادة تهيئة واجهة سوق سند الرئيسية بذكاء...';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
    >
      {/* Golden Glowing Ambient Light */}
      <div className={`absolute w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-40 animate-pulse ${glowColor}`} />

      {/* Elegant Spinner Visual Group */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className={`w-24 h-24 rounded-full border-2 border-dashed ${isVip ? 'border-[#D4AF37]/50' : isBronze ? 'border-slate-400/50' : 'border-emerald-500/50'} relative flex items-center justify-center`}
        >
          {/* Internal Pulse Circle */}
          <div className={`absolute w-16 h-16 rounded-full animate-ping opacity-25 ${isVip ? 'bg-[#D4AF37]' : isBronze ? 'bg-slate-400' : 'bg-emerald-500'}`} />
        </motion.div>

        {/* Center icon floats elegantly */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`absolute inset-0 flex items-center justify-center ${accentColor}`}
        >
          {isVip || isBronze ? (
            <Crown className="w-10 h-10 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
          ) : (
            <Sparkles className="w-10 h-10" />
          )}
        </motion.div>
      </div>

      {/* Detailed Arabian Text */}
      <div className="space-y-3 max-w-md relative z-10" dir="rtl">
        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`text-xl sm:text-2xl font-black font-display tracking-wide ${isVip ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500' : 'text-white'}`}
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed px-4"
        >
          {desc}
        </motion.p>
      </div>

      {/* Micro Status Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-10 flex items-center gap-2 text-xs text-gray-550 font-mono"
        dir="rtl"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" />
        <span className="text-gray-400">جاري تجديد الواجهة...</span>
      </motion.div>
    </motion.div>
  );
}
