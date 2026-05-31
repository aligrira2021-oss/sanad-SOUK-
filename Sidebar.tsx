import React from 'react';
import { motion } from 'motion/react';
import { X, Grid, Shirt, User, Baby, Star, Car, Smartphone, Home, Coffee, PawPrint, Package, Droplets, TrendingUp, Crown, Clock, MessageCircle, BarChart3 } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onClose: () => void;
}

export default function Sidebar({ selectedCategory, setSelectedCategory, onClose }: SidebarProps) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-stretch justify-end"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ x: '-100%' }} // In RTL, x: -100% means move towards left. Let's check: positive x is right, negative is left. Wait, Framer motion usually uses physical pixels. So x: -100% is always left.
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-[#050505] w-[85%] max-w-sm h-full border-r border-white/5 flex flex-col overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 shrink-0 relative z-10 sticky top-0 backdrop-blur-sm">
           <h2 className="text-xl font-bold font-display text-white">القائمة الرئيسية</h2>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {/* Main Navigation Links */}
            <div className="mb-8 flex flex-col gap-2">
                <button onClick={() => { setSelectedCategory('الكل'); onClose(); }} className="flex items-center gap-4 text-white/80 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors text-right">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    <span className="font-semibold text-sm">الرائجة (Trending)</span>
                </button>
                <button onClick={() => { setSelectedCategory('الكل'); onClose(); }} className="flex items-center gap-4 text-white/80 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors text-right">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    <span className="font-semibold text-sm">إعلانات VIP</span>
                </button>
                <button onClick={() => { setSelectedCategory('الكل'); onClose(); }} className="flex items-center gap-4 text-white/80 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors text-right">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-sm">أحدث الإعلانات</span>
                </button>
                <button className="flex items-center gap-4 text-white/80 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors text-right opacity-50 cursor-not-allowed">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-sm">الرسائل</span>
                </button>
                <button className="flex items-center gap-4 text-white/80 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors text-right opacity-50 cursor-not-allowed">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-sm">الإحصائيات</span>
                </button>
            </div>

            <div className="w-full h-px bg-white/5 mb-6" />

            <h3 className="text-gray-500 font-bold mb-4 text-[11px] uppercase tracking-widest flex items-center gap-2">
               <Grid className="w-3.5 h-3.5" />
               الفئات (Categories)
            </h3>
            
            <div className="grid grid-cols-1 gap-1.5 focus:outline-none">
                {[
                   { name: 'الكل', icon: Grid, color: 'text-gray-400' },
                   { name: 'ملابس رجال', icon: Shirt, color: 'text-blue-400' },
                   { name: 'ملابس نساء', icon: User, color: 'text-rose-400' },
                   { name: 'ملابس اطفال', icon: Baby, color: 'text-orange-400' },
                   { name: 'ماكياج و اكسسوارات', icon: Star, color: 'text-purple-400' },
                   { name: 'عطورات', icon: Droplets, color: 'text-rose-400' },
                   { name: 'سيارات و دراجات', icon: Car, color: 'text-amber-400' },
                   { name: 'عقارات', icon: Home, color: 'text-cyan-400' },
                   { name: 'إلكترونيات', icon: Smartphone, color: 'text-indigo-400' },
                   { name: 'أثاث', icon: Package, color: 'text-lime-400' },
                   { name: 'أدوات منزلية', icon: Coffee, color: 'text-teal-400' },
                   { name: 'حيوانات', icon: PawPrint, color: 'text-yellow-400' }
                ].map((catObj) => {
                    const IconComp = catObj.icon;
                    const isSelected = selectedCategory === catObj.name;
                    
                    return (
                        <button
                            key={catObj.name}
                            onClick={() => { setSelectedCategory(catObj.name); onClose(); }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all focus:outline-none ${
                                isSelected
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="font-medium text-[13px]">{catObj.name}</span>
                            <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : catObj.color}`} />
                        </button>
                    );
                })}
            </div>
            
        </div>
      </motion.div>
    </motion.div>
  );
}
