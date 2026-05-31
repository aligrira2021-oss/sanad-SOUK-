import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Zap, Check, ArrowRight, User } from 'lucide-react';

interface WelcomeSplashModalProps {
  key?: React.Key;
  user?: {
    name: string;
    phone: string;
    plan: string;
    avatar?: string | null;
  } | null;
  onClose: () => void;
}

export default function WelcomeSplashModal({ user, onClose }: WelcomeSplashModalProps) {
  // Synthesize a luxurious, celebratory chime sound using Web Audio API on mount
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      // Beautiful harmonic progression of crystal crystal chime notes (E5 -> G#5 -> B5 -> E6)
      playTone(659.25, now, 0.8, 'sine');       // E5
      playTone(830.61, now + 0.12, 0.9, 'sine');  // G#5
      playTone(987.77, now + 0.24, 1.0, 'sine');  // B5
      playTone(1318.51, now + 0.36, 1.5, 'triangle'); // E6
      
    } catch (err) {
      console.warn('Welcome chime sound could not be initialized:', err);
    }
  }, []);

  // Determine design characteristics based on user plan
  const isVisitor = !user;
  const isSuperAdmin = user?.phone === '92942482';
  const isVip = user?.plan === 'vip' || isSuperAdmin;
  const isBronze = user?.plan === 'bronze';
  
  let headerText = isVisitor ? 'مرحباً بك كزائر في سوق سند' : (isSuperAdmin ? 'أهلاً بك في منصة النخبة، مدير النظام' : 'أهلاً بك في منصة النخبة');
  let planNameShared = isVisitor ? 'حساب زائر' : (isSuperAdmin ? 'المدير العام (VIP)' : 'العضوية التأسيسية المجانية');
  let planThemeClass = isVisitor ? 'from-gray-500/10 via-gray-400/5 to-gray-600/5 border-gray-500/20' : 'from-emerald-500/20 via-teal-500/10 to-emerald-600/5 border-emerald-500/30';
  let badgeColor = isVisitor ? 'text-gray-400 bg-gray-500/10 border-gray-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  
  if (isVip) {
    headerText = 'أهلاً بك في عالم النخبة الملكي';
    planNameShared = 'باقة النخبة الملكية VIP';
    planThemeClass = 'from-amber-500/35 via-yellow-600/15 to-amber-950/20 border-amber-500/40 shadow-[0_0_30px_rgba(212,175,55,0.15)]';
    badgeColor = 'text-[#D4AF37] bg-[#D4AF37]/15 border-[#D4AF37]/35';
  } else if (isBronze) {
    headerText = 'أهلاً بك في ركب المميزين';
    planNameShared = 'الباقة البرونزية الفضية';
    planThemeClass = 'from-slate-400/25 via-slate-500/10 to-slate-900/20 border-slate-400/40 shadow-[0_0_30px_rgba(148,163,184,0.15)]';
    badgeColor = 'text-slate-100 bg-slate-500/15 border-slate-400/35';
  }

  // Dual initials for placeholder avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'ز';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* Floating Sparkles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#D4AF37] opacity-60"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 100, 
              scale: Math.random() * 0.5 + 0.5,
              rotate: 0 
            }}
            animate={{ 
              y: -100, 
              rotate: 360,
              opacity: [0, 0.7, 0]
            }}
            transition={{ 
              duration: Math.random() * 6 + 6, 
              repeat: Infinity,
              delay: Math.random() * 3 
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles className={`w-${Math.random() > 0.5 ? '4' : '3'} h-${Math.random() > 0.5 ? '4' : '3'} ${isVip ? 'text-amber-400' : isBronze ? 'text-slate-300' : 'text-emerald-400'}`} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        className="bg-gradient-to-b from-[#0a0f0d] to-black rounded-[2rem] p-5 sm:p-6 border border-gray-800 shadow-2xl w-full max-w-[380px] relative text-center overflow-y-auto max-h-[85vh]"
      >
        {/* Subtle radial golden background light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-r from-amber-500/20 to-yellow-400/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Celebration Badges */}
        <div className="relative z-10 flex justify-center mb-5">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            className="relative"
          >
            {/* Spinning background glow */}
            <div className={`absolute inset-0 rounded-full blur-xl scale-125 opacity-70 animate-pulse ${isVip ? 'bg-amber-400/30' : isBronze ? 'bg-slate-300/30' : 'bg-emerald-500/30'}`} />
            
            {/* Main Avatar Container */}
            <div className={`w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr ${isVip ? 'from-[#D4AF37] via-amber-200 to-[#D4AF37]' : isBronze ? 'from-slate-400 via-white to-slate-500' : 'from-emerald-500 via-teal-200 to-emerald-600'} shadow-2xl relative z-10`}>
              <div className="w-full h-full bg-[#050907] rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className={`text-xl font-black font-display tracking-widest ${isVip ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-100' : isBronze ? 'text-slate-100' : 'text-emerald-300'}`}>
                      {initials}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Crown or Icon indicator floated at extreme top-right */}
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -top-3 -right-3 rounded-full p-2 shadow-2xl ${isVip ? 'bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black' : isBronze ? 'bg-gradient-to-tr from-slate-300 to-white text-slate-950' : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white'}`}
              >
                {isVip && <Crown className="w-4 h-4 fill-amber-900/30" />}
                {isBronze && <Crown className="w-4 h-4 fill-slate-700" />}
                {!isVip && !isBronze && <Zap className="w-4 h-4 fill-emerald-800/20" />}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Welcome Messages */}
        <div className="relative z-10 space-y-2 mb-6" dir="rtl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-[11px] font-bold tracking-wider uppercase font-display select-none ${isVip ? 'text-[#D4AF37]' : isBronze ? 'text-slate-300' : 'text-emerald-400'}`}
          >
            ✦ {headerText} ✦
          </motion.p>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl font-black text-white font-display leading-tight tracking-tight drop-shadow-md"
          >
            مرحباً بك، <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isVip ? 'from-[#D4AF37] via-yellow-200 to-[#F5ECE2]' : isBronze ? 'from-slate-200 via-white to-slate-400' : isVisitor ? 'from-gray-300 via-gray-100 to-gray-400' : 'from-emerald-300 via-teal-100 to-emerald-400'}`}>{user?.name || 'ضيفنا الكريم'}</span>!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mx-auto font-sans"
          >
            {isVisitor ? 'استكشف سوق سند واكتشف أفضل العروض في تونس. سجل الآن لتتمكن من نشر إعلاناتك والتواصل مع البائعين بحرية!' : 'لقد تم تفعيل حسابك بنجاح على سوق سند. المنصة الحصرية لتجربة تداول وعرض راقية للمنتجات الممتازة في تونس.'}
          </motion.p>
        </div>

        {/* Membership Showcase Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className={`relative rounded-2xl p-5 border text-right mb-8 overflow-hidden select-none bg-gradient-to-b ${planThemeClass}`}
          dir="rtl"
        >
          {/* Subtle diagonal shine line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-sm font-bold text-gray-300">{isVisitor ? 'مميزات تسجيل الدخول' : 'تفاصيل العضوية المفعّلة'}</h4>
            <span className={`text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded-full border ${badgeColor}`}>
              {planNameShared}
            </span>
          </div>

          <div className="space-y-2.5">
            {isVisitor ? (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-300/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>تواصل المباشر مع البائعين وعرض المنتجات.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>نشر إعلانات خاصة بك مجاناً بسهولة.</span>
                </div>
              </>
            ) : isVip ? (
              <>
                <div className="flex items-center gap-2 text-xs text-amber-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>تألق بالتاج الذهبي وعرّف نفسك بصفتك بائع ملكي VIP.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>إعلانات ممولة غير محدودة في الصدارة وواجهات السوق الرئيسية.</span>
                </div>
              </>
            ) : isBronze ? (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-slate-300" />
                  <span>شارة التاج الفضي للتميز والمستقلين الناجحين.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-slate-300" />
                  <span>2 إعلانات ممولة شهرياً في الصدارة مع بوسترات فنية مميزة.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-emerald-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>نشر غير محدود لإعلاناتك بسهولة وسرعة بالغة.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-200/90 font-display">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>دعم فني عادي على مدار الساعة لكافة احتياجاتك.</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Guiding text / Visual helper */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
          className="text-center mb-2"
        >
          <span className="text-xs text-gray-400/80 font-medium font-sans flex justify-center items-center gap-1">
            <ArrowRight className="w-3 h-3 -rotate-90" />
            اضغط هنا للدخول إلى المتجر
          </span>
        </motion.div>

        {/* Primary Call To Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className={`w-full relative py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold font-display text-base border transition-all shadow-xl group overflow-hidden ${
            isVip
              ? 'bg-gradient-to-r from-[#D4AF37] via-yellow-400 to-[#D4AF37] text-black border-yellow-300 shadow-[0_0_30px_rgba(212,175,55,0.4)] animate-pulse'
              : isBronze
              ? 'bg-gradient-to-r from-slate-350 to-slate-100 text-slate-900 border-white shadow-[0_0_30px_rgba(148,163,184,0.4)] animate-pulse'
              : isVisitor
              ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border-gray-400 shadow-[0_0_30px_rgba(156,163,175,0.4)] hover:brightness-110'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse hover:animate-none'
          }`}
        >
          {/* Shine Sweep animation effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <User className="w-5 h-5 shrink-0" />
          <span>{isVisitor ? 'استكشاف المتجر كزائر' : 'الدخول إلى المتجر'}</span>
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
