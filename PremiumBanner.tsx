import { motion } from 'motion/react';
import { Sparkles, Crown } from 'lucide-react';

export default function PremiumBanner({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#0a0a09] via-[#120f0a] to-[#070707] border border-[#D4AF37]/15 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between text-center md:text-right gap-6 shadow-[0_10px_35px_rgba(212,175,55,0.03)]"
    >
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute -top-12 -right-12 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl opacity-30 animate-pulse" />
      </div>

      <div className="relative z-10 space-y-2 max-w-xl mx-auto md:mx-0">
        <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            عالم التميز والفرادة
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            انضم إلى عالم <span className="bg-gradient-to-r from-[#D4AF37] via-yellow-250 to-[#9e7a2f] text-transparent bg-clip-text font-serif">سند النخبة</span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto md:mx-0 font-light">
            ضاعف مبيعاتك بنسب هائلة، واحصل على وصول فوري لجمهورك المستهدف مع خدمات إعلانية مخصصة تليق بتميزك كشريك استراتيجي.
        </p>
      </div>
      
      <div className="relative z-10 shrink-0">
        <motion.button 
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpgradeClick}
            className="group relative bg-[#D4AF37] hover:bg-[#c5a059] text-black font-extrabold text-xs sm:text-sm py-3.5 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_5px_15px_rgba(212,175,55,0.2)] overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <Crown className="w-4 h-4 text-black shrink-0" />
            <span className="tracking-wide">ترقية حسابك الآن</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
