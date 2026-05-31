import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Settings, LogOut, Package, Camera, Check, Eye, EyeOff, Crown, MapPin, Calendar, Smartphone, ShieldCheck, Bell } from 'lucide-react';

export default function ProfileModal({ 
  onClose, 
  onOpenAdmin, 
  phone, 
  onLogout, 
  currentUserPlan, 
  pendingPlan, 
  currentUser, 
  onSaveProfile, 
  stats,
  favoriteCategories = [],
  onToggleFavoriteCategory = () => {},
  notificationPermissionStatus = 'default',
  onRequestNotificationPermission = () => {}
}: { 
  key?: React.Key, 
  onClose: () => void, 
  onOpenAdmin?: () => void, 
  phone?: string, 
  onLogout?: () => void, 
  currentUserPlan?: string, 
  pendingPlan?: string | null, 
  currentUser?: any, 
  onSaveProfile?: (name: string, avatar: string | null) => void, 
  stats?: { active: number, views: number, sold: number },
  favoriteCategories?: string[],
  onToggleFavoriteCategory?: (category: string) => void,
  notificationPermissionStatus?: string,
  onRequestNotificationPermission?: () => void
}) {

  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || 'المستخدم الحالي');
  const [originalName, setOriginalName] = useState(currentUser?.name || 'المستخدم الحالي');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(currentUser?.avatar || null);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(currentUser?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayStats = stats || { active: 3, views: 124, sold: 1 };

  const handleCancelEntry = () => {
    setProfileName(originalName);
    setAvatar(originalAvatar);
    setPassword('');
    setIsEditing(false);
  };

  const handleSave = () => {
    setOriginalName(profileName);
    setOriginalAvatar(avatar);
    setIsEditing(false);
    if (onSaveProfile) onSaveProfile(profileName, avatar);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150; // profile image is small
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85); // good quality and very small
            setAvatar(compressed);
            if (onSaveProfile) {
              onSaveProfile(profileName, compressed);
            }
          } else {
            const raw = reader.result as string;
            setAvatar(raw);
            if (onSaveProfile) {
              onSaveProfile(profileName, raw);
            }
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const planName = currentUserPlan === 'vip' ? 'عضوية ذهبية VIP' : currentUserPlan === 'bronze' ? 'عضوية برونزية' : 'عضوية مجانية';

  // Define colors based on plan
  const planColor = currentUserPlan === 'vip' ? 'from-[#D4AF37] via-[#FFD700] to-[#F3E5AB]' : currentUserPlan === 'bronze' ? 'from-[#CD7F32] via-[#B87333] to-[#A0522D]' : 'from-gray-700 via-gray-600 to-gray-800';
  const planGlow = currentUserPlan === 'vip' ? 'shadow-[0_0_20px_rgba(212,175,55,0.4)]' : currentUserPlan === 'bronze' ? 'shadow-[0_0_20px_rgba(205,127,50,0.3)]' : 'shadow-none';
  const crownColor = currentUserPlan === 'vip' ? 'text-[#D4AF37]' : currentUserPlan === 'bronze' ? 'text-[#CD7F32]' : 'text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 lg:p-0"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="bg-[#020806] w-full max-w-sm rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative"
        dir="rtl"
      >
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain scroll-smooth touch-pan-y">
            {/* Unified Scrollable Container Header */}
            <div className="px-6 pt-4 pb-1 flex justify-between items-center relative z-10 shrink-0">
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
               </button>
               <h2 className="text-lg font-black font-display text-white">الملف الشخصي</h2>
               <div className="w-10"></div>
            </div>

            <div className="px-6 pb-6">
                {/* Drag Handle Indicator */}
                <div className="flex justify-center pt-1 mb-2">
                    <div className="w-8 h-1 bg-white/10 rounded-full" />
                </div>

                {/* COMPACT HEADER - AVATAR + PRIMARY ACTIONS */}
                <div className="flex items-center justify-between gap-4 mb-4 mt-0 px-2">
                    {/* Logout Button Side */}
                    <button 
                      onClick={() => { if(onLogout) onLogout(); onClose(); }} 
                      className="flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-black border border-red-500/20 text-red-500 group active:scale-90 transition-all hover:bg-red-500/10"
                      title="تسجيل الخروج"
                    >
                        <div className="w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tight">خروج</span>
                    </button>

                    {/* THE CROWNED AVATAR */}
                    <div className="relative group shrink-0">
                        {/* The "Hizam" Belt Ring */}
                        <div 
                          className={`w-20 h-20 rounded-full bg-gradient-to-tr ${planColor} p-[2px] cursor-pointer relative transition-all duration-500 ${planGlow} group-hover:scale-105`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-full h-full bg-[#020806] rounded-full flex items-center justify-center overflow-hidden relative border-4 border-[#020806]">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-gray-600" />
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />

                        {/* Subscription Crown Badge (The Taj) */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
                        >
                          <div className={`bg-gray-950 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full shadow-2xl flex items-center gap-1 ${planGlow}`}>
                            <Crown className={`w-3 h-3 ${crownColor} drop-shadow-[0_0_8px_currentColor]`} />
                            <span className={`text-[8px] font-black tracking-tight ${crownColor}`}>{planName.split(' ')[1]}</span>
                          </div>
                        </motion.div>
                    </div>

                    {/* Admin/Settings Side */}
                    {onOpenAdmin ? (
                       <button 
                         onClick={() => { onClose(); onOpenAdmin(); }} 
                         className="flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-black border border-[#D4AF37]/20 text-[#D4AF37] group active:scale-90 transition-all hover:bg-[#D4AF37]/10"
                         title="لوحة الإدارة"
                       >
                           <div className="w-10 h-10 rounded-full border border-[#D4AF37]/20 flex items-center justify-center">
                               <ShieldCheck className="w-5 h-5" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-tight">إدارة</span>
                       </button>
                    ) : (
                       <button 
                         onClick={() => setIsEditing(true)}
                         className="flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-black border border-blue-500/20 text-blue-400 group active:scale-90 transition-all hover:bg-blue-500/10"
                         title="تعديل الملف"
                       >
                           <div className="w-10 h-10 rounded-full border border-blue-500/20 flex items-center justify-center">
                               <Settings className="w-5 h-5" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-tight">تعديل</span>
                       </button>
                    )}
                </div>

                {/* ORGANIZED INFORMATION GRID */}
                <div className="space-y-2 mb-3">
                    {isEditing ? (
                        <div className="space-y-2.5 bg-[#050505] p-4 rounded-[2rem] border border-[#D4AF37]/50 mb-2 shadow-inner">
                            <div className="space-y-1">
                                <label className="text-[8px] text-gray-500 mr-2 font-black uppercase tracking-tighter">الاسم الكامل</label>
                                <input 
                                  type="text" 
                                  value={profileName}
                                  onChange={e => setProfileName(e.target.value)}
                                  className="w-full bg-black border border-white/10 rounded-xl py-2 px-4 text-white text-xs font-bold focus:border-[#D4AF37] outline-none transition-shadow"
                                  placeholder="الاسم الكامل"
                                />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] text-gray-500 mr-2 font-black uppercase tracking-tighter">كلمة المرور الجديدة</label>
                               <div className="relative">
                                  <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl py-2 px-4 text-white text-xs font-bold focus:border-[#D4AF37] outline-none transition-shadow"
                                    placeholder="..."
                                  />
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3 text-gray-400">
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                               </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center mb-2">
                            <h3 className="text-xl font-black text-white mb-0.5 tracking-tight">{profileName}</h3>
                            <p className="text-[#10B981] text-[9px] font-black flex items-center gap-1 uppercase tracking-widest">
                              <Check className="w-3 h-3" /> حساب موثق ونشط
                            </p>
                        </div>
                    )}

                    {/* ADS DASHBOARD STATISTICS - DEEP BLACK STYLING with Gold Border */}
                    <div className="bg-[#050505] rounded-[1.8rem] p-4 border border-[#D4AF37]/30 shadow-inner">
                       <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">إحصائيات إعلاناتك</span>
                          <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                           <div className="flex flex-col items-center bg-black rounded-xl p-2.5 border border-white/[0.03]">
                               <span className="text-base font-black text-white">{displayStats.active}</span>
                               <span className="text-[7px] text-gray-500 font-black uppercase">نشطة</span>
                           </div>
                           <div className="flex flex-col items-center bg-black rounded-xl p-2.5 border border-white/[0.03]">
                               <span className="text-base font-black text-[#10B981]">{displayStats.views}</span>
                               <span className="text-[7px] text-gray-500 font-black uppercase">مشاهدات</span>
                           </div>
                           <div className="flex flex-col items-center bg-black rounded-xl p-2.5 border border-white/[0.03]">
                               <span className="text-lg font-black text-blue-400">{displayStats.sold}</span>
                               <span className="text-[7px] text-gray-500 font-black uppercase">مباعة</span>
                           </div>
                       </div>
                    </div>

                    {/* Info Quick Grid - DEEP BLACK STYLING with Gold Border */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#050505] p-3 rounded-[1.5rem] border border-[#D4AF37]/20 flex items-center gap-2 shadow-inner">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/5">
                                <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[7px] text-gray-500 font-black uppercase tracking-tighter">الهاتف</p>
                                <p className="text-[11px] text-white font-mono font-bold tracking-tight">{phone}</p>
                            </div>
                        </div>
                        <div className="bg-[#050505] p-3 rounded-[1.5rem] border border-[#D4AF37]/20 flex items-center gap-2 shadow-inner">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/5">
                                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[7px] text-gray-500 font-black uppercase tracking-tighter">العضوية</p>
                                <p className={`text-[10px] font-black ${crownColor}`}>{planName.split(' ')[1]}</p>
                            </div>
                        </div>
                    </div>

                    {pendingPlan && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-amber-500/10 text-amber-500 border border-amber-500/10 p-2 rounded-xl text-[8px] font-black text-center uppercase tracking-widest"
                        >
                            طلب العضوية قيد المراجعة...
                        </motion.div>
                    )}

                    {/* Favorite Categories / FCM Push Notifications Dashboard */}
                    <div className="bg-[#050505] rounded-[1.8rem] p-4 border border-[#D4AF37]/30 shadow-inner mt-2">
                       <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">تنبيهات الأقسام المفضلة</span>
                          <Bell className={`w-3.5 h-3.5 ${notificationPermissionStatus === 'granted' ? 'text-[#10B981]' : 'text-[#D4AF37]'}`} />
                       </div>
                       
                       <p className="text-[9.5px] text-gray-400 mb-3 text-right leading-relaxed">
                         اختر أقسامك المفضلة لتلقي تنبيهات وإشعارات لحظية مخصصة فور إضافة أي معروضات جديدة من أي بائع آخر بالسوق!
                       </p>

                       {/* Notification Permission Enabler */}
                       <div className="mb-3">
                         {notificationPermissionStatus === 'granted' ? (
                           <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black">
                             <Check className="w-3.5 h-3.5" />
                             <span>نظام التنبيهات الفورية (FCM) نشط الآن 🟢</span>
                           </div>
                         ) : (
                           <button
                             type="button"
                             onClick={onRequestNotificationPermission}
                             className="w-full py-2 px-3 bg-gradient-to-r from-[#D4AF37] to-[#b38f2e] text-black rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                           >
                             <Bell className="w-3.5 h-3.5" />
                             <span>تفعيل الإشعارات الفورية بالمتصفح 🔔</span>
                           </button>
                         )}
                       </div>

                       {/* Favorite Category Toggles */}
                       <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1 pr-0.5">
                         {['ملابس رجال', 'ملابس نساء', 'ملابس اطفال', 'ماكياج و اكسسوارات', 'عطورات', 'عقارات', 'سيارات و دراجات', 'إلكترونيات', 'أثاث', 'أدوات منزلية', 'حيوانات', 'تحف و هدايا'].map((cat) => {
                           const isFav = favoriteCategories.includes(cat);
                           return (
                             <button
                               key={cat}
                               type="button"
                               onClick={() => onToggleFavoriteCategory(cat)}
                               className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer select-none ${
                                 isFav 
                                   ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] shadow-sm' 
                                   : 'bg-black border-white/5 text-gray-400 hover:text-white hover:border-[#D4AF37]/25'
                               }`}
                             >
                               <span className="text-[10px]">{isFav ? '★' : '☆'}</span>
                               {cat}
                             </button>
                           );
                         })}
                       </div>
                    </div>
                </div>

                <div className="space-y-2 mt-2">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div 
                              key="edit-actions"
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex flex-col gap-2 mb-1"
                            >
                                <button 
                                   onClick={handleSave} 
                                   className="w-full flex items-center justify-center gap-3 p-3.5 rounded-[1.2rem] bg-[#10B981] text-white font-black transition-all shadow-lg active:scale-95 text-xs"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>تأكيد وحفظ التغييرات</span>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                 <button onClick={() => setIsEditing(true)} className="w-full flex items-center gap-4 p-4 rounded-[1.8rem] bg-black border border-[#D4AF37]/60 hover:border-[#10B981]/40 transition-all text-[#10B981] group shadow-2xl">
                                    <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-[#10B981]/20">
                                        <Settings className="w-5 h-5 text-[#10B981]" />
                                    </div>
                                    <div className="flex flex-col items-start text-right">
                                        <span className="font-black text-xs tracking-tight">تعديل الملف الشخصي</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">تغيير البيانات والصورة</span>
                                    </div>
                                 </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
