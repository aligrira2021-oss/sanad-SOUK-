import React, { useState } from 'react';
import { Check, Zap, Star, Crown, Sparkles } from 'lucide-react';
import PaymentModal from './PaymentModal';

export default function PricingPackages({ 
  onSubscriptionRequest, 
  hasPendingRequest = false,
  showToast,
  currentUserPhone
}: { 
  onSubscriptionRequest: (plan: string) => void;
  hasPendingRequest?: boolean;
  showToast?: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  currentUserPhone?: string | null;
}) {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [showPendingOverlay, setShowPendingOverlay] = useState(false);

  const handlePkgClick = (pkgId: string) => {
    if (!currentUserPhone) {
      // Directs to login modal
      onSubscriptionRequest(pkgId);
      return;
    }

    if (hasPendingRequest) {
      setShowPendingOverlay(true);
      return;
    }

    setSelectedPkg(pkgId);
  };
  
  const packages = [
    {
      id: 'free',
      name: 'الباقة المجانية 🟢',
      price: 'مجاناً',
      icon: Zap,
      color: 'text-emerald-300',
      iconBg: 'bg-gradient-to-tr from-emerald-950 to-emerald-900 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      badge: 'انطلاقة',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      features: [
        'نشر إعلانات محدود',
        'ظهور الإعلانات في القسم الثالث',
        'عدم ظهور الإعلان في الستوري',
      ],
      cardStyle: 'border-2 border-emerald-500/40 bg-gradient-to-b from-[#0a2318] via-[#030d09] to-[#010302]',
      priceStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 font-extrabold',
      buttonStyle: 'bg-emerald-950/45 text-emerald-300'
    },
    {
      id: 'bronze',
      name: 'الباقة البرونزية الفضية 🥈',
      price: '49 د.ت / شهر',
      icon: Crown,
      color: 'text-slate-100',
      iconBg: 'bg-gradient-to-tr from-slate-700 to-slate-900 border-slate-400/50',
      badge: 'التاج الفضي 👑',
      badgeStyle: 'bg-slate-700/30 text-slate-100 border border-slate-400/40',
      features: [
        'نشر إعلانات غير محدود',
        'ظهور الإعلانات في القسم الثاني',
        'ظهور الإعلانات في الستوري (درجة ثانية)',
        'الحصول على 5 بوسترات لمنتج من اختيارك',
        'تسويق إعلان مدفوع لمدة يومين',
        'شارة التاج الفضي',
      ],
      cardStyle: 'border-2 border-slate-400/50 bg-gradient-to-b from-[#18202c] via-[#0b1016] to-[#030406]',
      priceStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400 font-black',
      buttonStyle: 'bg-slate-900/60 text-slate-100 border border-slate-400/45'
    },
    {
      id: 'vip',
      name: 'الباقة الذهبية الملكية VIP',
      price: '99 د.ت / شهر',
      icon: Crown,
      color: 'text-[#D4AF37]',
      iconBg: 'bg-gradient-to-tr from-[#2d2208] to-[#120e03] border-[#D4AF37]/30',
      badge: 'التاج الذهبي الملكي',
      badgeStyle: 'bg-gradient-to-r from-[#D4AF37]/20 to-amber-500/15 text-[#D4AF37] border border-[#D4AF37]/30 font-black',
      features: [
        'نشر إعلانات غير محدود',
        'أولوية ظهور الإعلانات',
        'ظهور الإعلانات في الستوري (درجة أولى)',
        'الحصول على 10 بوسترات لمنتج من اختيارك',
        'تسويق إعلان مدفوع لمدة 4 أيام',
        'شارة التاج الذهبي',
      ],
      cardStyle: '', 
      priceStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#AA7C11] font-black',
      buttonStyle: 'bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#AA7C11] text-black font-black'
    }
  ];

  return (
    <>
    <div id="pricing-packages" className="py-2 pb-6 scroll-mt-24" dir="rtl">
      <div className="text-center mb-10 px-4 space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] px-5 py-2 rounded-full text-xs font-bold border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
           <Sparkles className="w-4 h-4 animate-pulse-slow" />
           باقات الارتقاء والتميز
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">باقات التميز من سوق سند</h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed opacity-80">اختر المستوى الملكي الذي يضمن انتشار عروضك التجارية والعقارية بلمسة مخملية تميز خدماتك وتجعل حضورك في طليعة السوق.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 max-w-5xl mx-auto items-stretch">
        {packages.map((pkg, index) => {
          if (pkg.id === 'vip') {
            // VIP Card Wrapper with a beautifully decorated gold shiny gradient border and layout
            return (
              <div 
                key={pkg.id}
                className="relative rounded-[2rem] bg-gradient-to-tr from-[#AA7C11] via-[#FFF3B0] to-[#D4AF37] p-[2.5px] shadow-[0_15px_40px_rgba(212,175,55,0.12)] flex flex-col max-w-sm mx-auto w-full group transition-all duration-300 hover:scale-[1.03]"
              >
                {/* Floating Crown Badge */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-black font-black text-[10px] sm:text-xs px-4 py-1.5 rounded-full shadow-lg border border-[#FFF3B0] flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  شعبية وموصى بها
                </div>

                {/* Inner Card Section */}
                <div className="bg-gradient-to-b from-[#0f0c05] via-[#050505] to-[#010101] rounded-[1.85rem] p-4 flex flex-col flex-1 h-full shadow-inner">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-[0_0_20px_rgba(212,175,55,0.2)] ${pkg.iconBg}`}>
                      <pkg.icon className={`w-5 h-5 ${pkg.color} animate-pulse-slow`} />
                    </div>
                    {pkg.badge && (
                      <span className={`text-[9px] py-1 px-2.5 rounded-full font-bold shadow-[0_0_10px_rgba(212,175,55,0.1)] ${pkg.badgeStyle}`}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white mb-1 font-display drop-shadow-[0_0_25px_rgba(212,175,55,0.85)] text-shadow-gold">
                    {pkg.name}
                  </h3>
                  <p className={`text-xl font-black mb-3 ${pkg.priceStyle}`}>
                    {pkg.price}
                  </p>

                  <ul className="mb-4 space-y-2 flex-1 text-right">
                    {pkg.features.map((feature, idx) => (
                      <li key={`${pkg.id}-${idx}`} className="flex items-start gap-2.5 text-[11px] sm:text-xs text-gray-200">
                        <Check className="w-3.5 h-3.5 text-[#D3AF37] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handlePkgClick(pkg.id)} 
                    className={`w-full py-2.5 rounded-2xl font-extrabold text-xs transition-all ${pkg.buttonStyle}`}
                  >
                    امتلاك العضوية الذهبية
                  </button>
                </div>
              </div>
            );
          }

          // Non-VIP Package Cards with elegant, 3D premium border and design
          const isFree = pkg.id === 'free';
          const outerRingColor = isFree 
            ? 'from-emerald-500/50 via-teal-500/30 to-emerald-600/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
            : 'from-slate-400/50 via-slate-200/40 to-slate-500/50 shadow-[0_0_20px_rgba(148,163,184,0.2)]';
          const glowShadowClass = isFree
            ? 'hover:shadow-[0_20px_45px_rgba(16,185,129,0.35)] hover:border-emerald-400/60'
            : 'hover:shadow-[0_20px_45px_rgba(148,163,184,0.35)] hover:border-slate-300/60';
          
          return (
            <div 
              key={pkg.id}
              id={pkg.id === 'bronze' ? 'paid-packages' : (pkg.id === 'free' ? 'free-package' : undefined)}
              className={`relative rounded-[2rem] p-[2.5px] bg-gradient-to-tr ${outerRingColor} flex flex-col max-w-sm mx-auto w-full transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 scroll-mt-28 ${glowShadowClass}`}
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            >
              {/* Silver Crown Floating Tag for Bronze package */}
              {pkg.id === 'bronze' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-slate-300 via-white to-slate-400 text-slate-950 font-black text-[10px] sm:text-xs px-4 py-1.5 rounded-full shadow-2xl border border-white flex items-center gap-1.5 z-20 animate-pulse">
                  <Crown className="w-3.5 h-3.5 text-slate-900 fill-slate-700" />
                  التاج الفضي المميز ✦
                </div>
              )}

              {/* Free Branding Floating Tag */}
              {pkg.id === 'free' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-emerald-950 font-black text-[11px] sm:text-[13px] px-5 py-2 rounded-full shadow-2xl border border-emerald-200 flex items-center gap-1.5 z-20">
                  <Zap className="w-4 h-4 fill-emerald-900" />
                  الباقة المجانية ✧
                </div>
              )}

              {/* Inner container to capture the 3D block model feel */}
              <div className={`rounded-[1.85rem] p-4 flex flex-col flex-1 h-full w-full ${pkg.cardStyle}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${pkg.iconBg}`}>
                    <pkg.icon className={`w-4 h-4 ${pkg.color}`} />
                  </div>
                  {pkg.badge && (
                    <span className={`text-[9px] py-0.5 px-2.5 rounded-full font-bold ${pkg.badgeStyle} shadow-sm`}>
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <h3 className={`text-lg font-bold text-white mb-1 font-display ${pkg.id === 'free' ? 'drop-shadow-[0_0_20px_rgba(16,185,129,0.9)]' : 'drop-shadow-[0_0_20px_rgba(148,163,184,0.9)]'}`}>
                  {pkg.name}
                </h3>
                <p className={`text-lg font-black mb-3 ${pkg.priceStyle}`}>
                  {pkg.price}
                </p>

                <ul className="mb-4 space-y-2 flex-1 text-right">
                  {pkg.features.map((feature, idx) => (
                    <li key={`${pkg.id}-${idx}`} className="flex items-start gap-2.5 text-[11px] sm:text-xs text-gray-300">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isFree ? 'text-emerald-400' : 'text-slate-300'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {pkg.id === 'free' ? (
                  <div className="w-full py-2.5 text-center text-emerald-400 text-xs font-extrabold border border-emerald-500/20 bg-emerald-950/10 rounded-2xl shadow-inner font-display">
                     مفعلة تلقائياً للحساب ✧
                  </div>
                ) : (
                  <button 
                    onClick={() => handlePkgClick(pkg.id)} 
                    className={`w-full py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 transform active:scale-95 shadow-md ${pkg.buttonStyle}`}
                  >
                    اشتراك وترقية
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    
    {selectedPkg && <PaymentModal packageId={selectedPkg} onClose={() => setSelectedPkg(null)} onConfirm={() => onSubscriptionRequest(selectedPkg)} />}
    
    {showPendingOverlay && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={() => setShowPendingOverlay(false)}
      >
        <div className="bg-black border border-red-900/50 p-8 rounded-3xl text-center shadow-2xl shadow-red-950/20 max-w-sm w-full" dir="rtl">
            <span className="text-5xl block mb-4">⚠️</span>
            <h3 className="text-red-500 font-bold text-2xl mb-2 font-display">طلبكم قيد المراجعة</h3>
            <p className="text-gray-400 text-sm leading-relaxed">سيتم تفعيل عضويتكم قريباً، شكراً لصبركم.</p>
            <button 
                onClick={() => setShowPendingOverlay(false)}
                className="mt-6 w-full py-3 bg-red-950/20 hover:bg-red-900/30 text-red-500 rounded-xl font-bold transition-all border border-red-900/30"
            >
                إغلاق
            </button>
        </div>
      </div>
    )}
    </>
  );
}

