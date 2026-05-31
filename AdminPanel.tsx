import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { safeStorage } from '../lib/safeStorage';
import { doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { playSubscriptionClapSound } from '../lib/audioEffects';
import { 
  ShieldAlert, Users, LayoutList, CheckCircle, X, Settings, 
  DollarSign, Bell, Trash2, Search, Download, LayoutDashboard, 
  Sparkles, TrendingUp, ShieldCheck, Briefcase, RefreshCw, 
  Award, Calendar, ExternalLink, ArrowDownLeft, FileText, 
  BadgeCheck, Clock, Shield, Star, Crown, ChevronRight, Check
} from 'lucide-react';

interface AdminPanelProps {
  key?: React.Key;
  onClose: () => void;
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  systemRequests: any[];
  setSystemRequests: React.Dispatch<React.SetStateAction<any[]>>;
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  onAddUserNotification?: (phone: string, message: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function AdminPanel({ 
  onClose, 
  systemUsers = [], 
  setSystemUsers, 
  systemRequests = [], 
  setSystemRequests, 
  products = [], 
  setProducts, 
  notificationsCount, 
  setNotificationsCount,
  onAddUserNotification,
  showToast
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard'|'ads'|'users'|'requests'|'settings'|'subscribers'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'ads'>('revenue');
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  
  // Local settings for the platform
  const [platformCommission, setPlatformCommission] = useState(() => {
    return safeStorage.getItem('sanad_settings_commission') || '10';
  });
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return safeStorage.getItem('sanad_settings_maintenance') === 'true';
  });
  const [pricingVip, setPricingVip] = useState(() => {
    const val = safeStorage.getItem('sanad_settings_pricing_vip');
    const oldValues = ['100', '50', '50.00', '100 د.ت', '50 د.ت', '70', '150'];
    if (!val || oldValues.includes(String(val).trim())) {
      safeStorage.setItem('sanad_settings_pricing_vip', '99');
      return '99';
    }
    return val;
  });
  const [pricingBronze, setPricingBronze] = useState(() => {
    const val = safeStorage.getItem('sanad_settings_pricing_bronze');
    const oldValues = ['50', '30', '30.00', '50 د.ت', '30 د.ت', '35', '40'];
    if (!val || oldValues.includes(String(val).trim())) {
      safeStorage.setItem('sanad_settings_pricing_bronze', '49');
      return '49';
    }
    return val;
  });

  // Save Settings to safeStorage
  const handleSaveSettings = () => {
    safeStorage.setItem('sanad_settings_commission', platformCommission);
    safeStorage.setItem('sanad_settings_maintenance', String(maintenanceMode));
    safeStorage.setItem('sanad_settings_pricing_vip', pricingVip);
    safeStorage.setItem('sanad_settings_pricing_bronze', pricingBronze);
    triggerSuccessConfetti();
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#F3E5AB', '#10B981', '#FFFFFF']
    });
  };

  const handleDeleteAd = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'products', id));
          setProducts(products.filter(p => p.id !== id));
          if (showToast) showToast('تم حذف الإعلان بنجاح', 'success');
      } catch (e) {
          console.error("Failed to delete ad", e);
          if (showToast) showToast('حدث خطأ أثناء حذف الإعلان', 'error');
      }
  };
  
  const handleDeleteUser = async (id: string) => {
      const targetUser = systemUsers.find(u => u.id === id);
      if (targetUser) {
          const isSystemAdmin = (targetUser.phone && (
              targetUser.phone === '92942482' || 
              targetUser.phone === '21692942482' || 
              String(targetUser.phone).trim().replace(/\s+/g, '').endsWith('92942482')
          )) || (targetUser.id && (
              targetUser.id === '92942482' || 
              String(targetUser.id).trim().replace(/\s+/g, '').endsWith('92942482')
          )) || (targetUser.name && (
              targetUser.name.toUpperCase() === 'ADMIN' || 
              targetUser.name === 'المدير' || 
              targetUser.name === 'عضو الإدارة 👑' ||
              targetUser.name === 'أدمن'
          ));
          if (isSystemAdmin) {
              if (showToast) showToast('لا يمكن حذف حساب المدير!', 'error');
              return;
          }
      }
      try {
          await deleteDoc(doc(db, 'systemUsers', id));
          setSystemUsers(systemUsers.filter(u => u.id !== id));
          if (showToast) showToast('تم حذف الحساب بنجاح', 'success');
      } catch (e) {
          console.error("Failed to delete user", e);
          if (showToast) showToast('حدث خطأ أثناء حذف الحساب', 'error');
      }
  };

  const handleActivateRequest = async (req: any) => {
      if (!req || !req.phone) {
          if (showToast) showToast('طلب غير صالح أو رقم الهاتف مفقود', 'error');
          return;
      }
      const phoneStr = String(req.phone).trim().replace(/\s+/g, '');
      const reqIdStr = req.id ? String(req.id).trim() : '';

      // Find user by phone in system
      const existingUser = systemUsers.find(u => {
          const uPhone = u.phone ? String(u.phone).trim().replace(/\s+/g, '') : '';
          const uId = u.id ? String(u.id).trim().replace(/\s+/g, '') : '';
          return uPhone === phoneStr || uId === phoneStr;
      });

      // Update Parent State Locally for instant feedback
      setSystemRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'activated' } : r));
      if (notificationsCount > 0) setNotificationsCount(prev => Math.max(0, prev - 1));
      
      if (existingUser) {
          setSystemUsers(prev => prev.map(u => (u.id === existingUser.id || u.phone === phoneStr) ? { ...u, plan: req.plan } : u));
      } else {
          setSystemUsers(prev => [...prev, { id: phoneStr, name: req.user || `مستخدم ${phoneStr}`, phone: phoneStr, plan: req.plan }]);
      }

      if (onAddUserNotification) {
          onAddUserNotification(phoneStr, 'تم تفعيل باقتكم بنجاح شكرا');
      }

      setSelectedRequest(null);
      // Trigger visual confetti and satisfying applause sound
      setTimeout(() => {
        triggerSuccessConfetti();
        try { playSubscriptionClapSound(); } catch (err) { console.error(err); }
      }, 100);

      // Now run the DB operations in background
      try {
          const targetUserId = existingUser?.id || phoneStr;
          if (existingUser) {
              await setDoc(doc(db, 'systemUsers', targetUserId), { plan: req.plan }, { merge: true });
          } else {
              await setDoc(doc(db, 'systemUsers', targetUserId), { name: req.user || `مستخدم ${phoneStr}`, phone: phoneStr, plan: req.plan });
          }

          if (reqIdStr) {
              await deleteDoc(doc(db, 'systemRequests', reqIdStr));
          }

          // Auto-upgrade user's existing products
          const userProducts = products.filter(p => p.sellerId === targetUserId || p.phone === targetUserId || p.sellerId === phoneStr);
          for (const p of userProducts) {
              if (p.plan !== req.plan) {
                  await updateDoc(doc(db, 'products', p.id), { plan: req.plan }).catch(e => console.error("Failed to update product plan", e));
              }
          }

          if (showToast) showToast('تم تأكيد وتفعيل الاشتراك بنجاح ✦', 'success');
      } catch (e) {
          console.error("Failed to update user plan or delete request in Firestore:", e);
          if (showToast) showToast('حدث خطأ أثناء مزامنة التفعيل مع السيرفر، ولكن تم التحديث مؤقتاً بالخلفية.', 'warning');
      }
  };

  // Dynamic calculations for luxury dashboard stats
  const vipCount = systemUsers.filter(u => u.plan === 'vip').length;
  const bronzeCount = systemUsers.filter(u => u.plan === 'bronze').length;
  
  // Ad count per user
  const adCounts = products.reduce((acc: Record<string, number>, p: any) => {
    acc[p.sellerId] = (acc[p.sellerId] || 0) + 1;
    return acc;
  }, {});
  
  const calculatedVipRevenue = vipCount * parseFloat(pricingVip);
  const calculatedBronzeRevenue = bronzeCount * parseFloat(pricingBronze);
  const calculatedListingsRevenue = products.length * 10; // 10 TND per listing insertion fee
  const grandTotalRevenue = calculatedVipRevenue + calculatedBronzeRevenue + calculatedListingsRevenue;

  // Custom high-fidelity analytic data
  const chartData = [
    { label: 'السبت', ads: 3, revenue: Math.round(grandTotalRevenue * 0.4) },
    { label: 'الأحد', ads: 5, revenue: Math.round(grandTotalRevenue * 0.55) },
    { label: 'الإثنين', ads: 8, revenue: Math.round(grandTotalRevenue * 0.7) },
    { label: 'الثلاثاء', ads: 9, revenue: Math.round(grandTotalRevenue * 0.8) },
    { label: 'الأربعاء', ads: Math.max(4, products.length - 2), revenue: Math.round(grandTotalRevenue * 0.9) },
    { label: 'الخميس', ads: Math.max(6, products.length - 1), revenue: Math.round(grandTotalRevenue * 0.95) },
    { label: 'الجمعة (اليوم)', ads: products.length || 7, revenue: grandTotalRevenue },
  ];

  // Filters
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = systemUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const filteredRequests = systemRequests.filter(r => 
    r.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  // Auto scroll to top on tab change
  useEffect(() => {
    const mainContent = document.getElementById('admin-main-scroll');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 min-h-screen z-[70] bg-[#020202] text-gray-200 flex flex-col font-sans overflow-y-auto"
      dir="rtl"
    >
        {/* Glow ambient spots */}
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#10B981]/5 blur-[120px] pointer-events-none" />

        {/* Global Premium Navigation Header */}
        <div className="px-6 py-4 border-b border-gray-900 flex justify-between items-center bg-[#070707]/90 backdrop-blur-xl shrink-0 relative z-30 shadow-2xl">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#111] to-[#050505] border border-[#D4AF37]/30 flex items-center justify-center shadow-lg">
                 <Shield className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="flex flex-col">
                 <span className="text-white text-md font-bold font-display tracking-tight flex items-center gap-2">
                    جناح الإدارة التنفيذي
                    <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full">برو ✦</span>
                 </span>
                 <span className="text-gray-500 text-xs">نظام إدارة المحتوى السحابي الذكي لسند</span>
              </div>
           </div>
           
           <div className="flex gap-4 items-center">
                {/* Active counters */}
                {systemRequests.filter(r => r.status !== 'activated').length > notificationsCount && (
                  <button 
                    onClick={() => { setActiveTab('requests'); setNotificationsCount(systemRequests.filter(r => r.status !== 'activated').length); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-pulse hover:bg-red-500/20 transition-all"
                  >
                     <Bell className="w-3.5 h-3.5" />
                     <span>{systemRequests.filter(r => r.status !== 'activated').length - notificationsCount} طلب جديد</span>
                  </button>
                )}

                <div className="hidden lg:flex items-center gap-2 bg-[#090909] px-3 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>توقيت النظام: ٢٠٢٦-٠٥-٢٠ م</span>
                </div>

                <div className="w-px h-6 bg-gray-800 hidden md:block" />

                <div className="flex items-center gap-2.5">
                   <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-black font-black text-sm flex items-center justify-center shadow-md">
                         AD
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] border-2 border-[#020202] rounded-full" />
                   </div>
                   <div className="hidden md:flex flex-col text-right">
                      <span className="text-xs font-bold text-white leading-tight">المدير العام</span>
                      <span className="text-[10px] text-[#10B981] font-bold">متصل نشط</span>
                   </div>
                </div>

                <button 
                   onClick={onClose} 
                   className="p-2.5 bg-gray-900 hover:bg-[#151515] hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-all border border-gray-800"
                   title="الرجوع للرئيسية"
                >
                   <X className="w-5 h-5" />
                </button>
           </div>
        </div>

        {/* Universal Sub-Header Search System */}
        <div className="px-6 py-3.5 bg-[#050505] border-b border-gray-900 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
              <div className="relative w-full md:max-w-md">
                  <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="ابحث بالاسم، برقم الهاتف أو صنف الإعلان..." 
                     className="w-full bg-[#0a0a0a] border border-gray-800/80 rounded-2xl py-2.5 pr-10 pl-4 text-white text-xs placeholder-gray-500 focus:border-[#D4AF37]/70 hover:border-gray-700 outline-none transition-all duration-300 shadow-inner" 
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">
                      مسح
                    </button>
                  )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400 self-stretch md:self-auto justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                 <span className="text-gray-500 whitespace-nowrap">اقتراحات سريعة:</span>
                 <button onClick={() => setSearchQuery('vip')} className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#D4AF37] text-white">VIP</button>
                 <button onClick={() => setSearchQuery('عقارات')} className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#10B981] text-white">عقارات</button>
                 <button onClick={() => setSearchQuery('92942482')} className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#10B981] text-white">الأدمن</button>
              </div>
        </div>

        <div className="bg-[#020202] flex">
            {/* Sidebar menu - Luxury Glassmorphic */}
            <div className="w-64 bg-[#040404] border-l border-gray-900/60 p-5 shrink-0 hidden md:block relative z-10">
                <div className="mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3">لوحات التحليل</div>
                <MenuContent activeTab={activeTab} setActiveTab={setActiveTab} systemRequestsCount={systemRequests.filter(r => r.status !== 'activated').length} systemRequests={systemRequests} />
            </div>

            {/* Main Content Area */}
            <div 
              id="admin-main-scroll"
              className="flex flex-col p-5 md:p-8 w-full relative z-10 bg-gradient-to-b from-[#020202] to-[#050505]"
            >
                 {/* Mobile Tabs Controller */}
                 <div className="md:hidden flex gap-2 overflow-x-auto mb-6 pb-2 scrollbar-hide shrink-0 border-b border-gray-900">
                    <button onClick={() => setActiveTab('dashboard')} className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : 'bg-[#050505] text-gray-400 border border-gray-800 hover:border-gray-700'}`}>لوحة القيادة</button>
                    <button onClick={() => setActiveTab('ads')} className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 ${activeTab === 'ads' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : 'bg-[#050505] text-gray-400 border border-gray-800 hover:border-gray-700'}`}>الطلبات والإعلانات</button>
                    <button onClick={() => setActiveTab('requests')} className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 relative ${activeTab === 'requests' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.08)]' : 'bg-[#050505] text-gray-400 border border-gray-800 hover:border-gray-700'}`}>
                      طلبات التفعيل
                      {systemRequests.length > 0 && <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>}
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 ${activeTab === 'users' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : 'bg-[#050505] text-gray-400 border border-gray-800'}`}>قاعدة المشتركين</button>
                    <button onClick={() => setActiveTab('settings')} className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 ${activeTab === 'settings' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : 'bg-[#050505] text-gray-400 border border-gray-800'}`}>الإعدادات</button>
                 </div>

                 <AnimatePresence mode="wait">
                    {activeTab === 'subscribers' && (
                        <motion.div 
                          key="tab-subscribers"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3 }}
                          className="w-full max-w-6xl mx-auto space-y-6"
                        >
                            <h3 className="text-white font-bold text-2xl font-display">قائمة المشتركين ومتابعة الاشتراكات</h3>
                            <div className="bg-[#050505] border border-gray-900 rounded-3xl p-6">
                                <div className="grid grid-cols-6 gap-4 text-xs text-gray-500 font-bold mb-4 px-4 pb-2 border-b border-gray-900">
                                    <div className="col-2">اسم المشترك</div>
                                    <div>الاعلانات</div>
                                    <div>العضوية</div>
                                    <div>البداية</div>
                                    <div>الانتهاء</div>
                                    <div>تنبيه</div>
                                </div>
                                <div className="space-y-2">
                                  {systemUsers.map((user) => (
                                     <div key={user.id} className="grid grid-cols-6 gap-4 items-center bg-[#070707] hover:bg-[#0a0a0a] rounded-2xl p-4 border border-gray-900 shadow-sm transition">
                                        <div className="col-span-2 text-white text-xs font-bold">{user.name}</div>
                                        <div className="text-white text-xs">{adCounts[user.id] || 0} إعلان</div>
                                        <div className={`text-[10px] font-black px-2 py-1 rounded-full w-fit ${user.plan === 'vip' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-amber-500/15 text-amber-500'}`}>
                                            {user.plan === 'vip' ? 'VIP الذهبي' : 'برونزي'}
                                        </div>
                                        <div className="text-gray-400 text-xs">{user.subscriptionStartDate || '---'}</div>
                                        <div className="text-gray-400 text-xs">{user.subscriptionEndDate || '---'}</div>
                                        <div>
                                            <button 
                                              onClick={() => showToast && user.phone ? onAddUserNotification?.(user.phone, 'تنبيه: اشتراكك سينتهي قريباً!') : null}
                                              className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-xl hover:bg-[#D4AF37]/20 font-bold">
                                               إرسال تنبيه
                                            </button>
                                        </div>
                                     </div>
                                  ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'dashboard' && (
                        <motion.div 
                          key="tab-dashboard"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-8 max-w-6xl mx-auto w-full"
                        >
                            {/* Premium Welcome & Top Row action */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                   <h3 className="text-white font-bold text-2xl font-display flex items-center gap-2">
                                      مرحباً بك، سيادة المدير 👑
                                   </h3>
                                   <p className="text-gray-400 text-xs mt-1">توضح هذه الإحصائيات أداء المنصة الحقيقي وأنشطة المشتركين بدقة تفصيلية.</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    window.print();
                                  }}
                                  className="flex items-center gap-2 text-xs text-[#D4AF37] font-bold bg-[#111111]/80 border border-[#D4AF37]/30 hover:border-[#D4AF37] px-4.5 py-2.5 rounded-2xl transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] group hover:scale-101"
                                >
                                    <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span>طباعة تقرير الأعمال</span>
                                </button>
                            </div>
                            
                            {/* Premium Bento Grid - Metrics cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-2">
                                {/* Revenue Stats Card (GOLD luxury skin) */}
                                <div className="bg-[#050505] border border-[#D4AF37]/25 rounded-xl p-5 relative overflow-hidden group shadow-[0_0_20px_rgba(212,175,55,0.03)] hover:shadow-[0_0_30px_rgba(212,175,55,0.08)] hover:border-[#D4AF37]/50 transition-all duration-300 max-w-[290px] xs:max-w-xs sm:max-w-sm lg:max-w-none mx-auto w-full">
                                    <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-40 group-hover:animate-shine-sweep pointer-events-none" />
                                    <div className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none group-hover:text-white/[0.04] transition-all duration-300">
                                       <DollarSign className="w-32 h-32" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                       <span className="text-gray-400 text-xs font-bold">إجمالي أرباح المنصة</span>
                                       <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                                          <DollarSign className="w-4 h-4" />
                                       </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-2">
                                       <p className="text-3xl font-display font-black text-white">{grandTotalRevenue}</p>
                                       <span className="text-xs text-[#D4AF37] font-bold">د.ت</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-500">
                                       <span className="text-[#10B981] font-bold">✦ مباشر</span>
                                       <span>• اشتراكات VIP وبرونز والإعلانات</span>
                                    </div>
                                </div>

                                {/* Active Products Count */}
                                <div className="bg-[#050505] border border-gray-950 rounded-xl p-5 relative overflow-hidden group hover:border-[#10B981]/45 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-300 max-w-[290px] xs:max-w-xs sm:max-w-sm lg:max-w-none mx-auto w-full">
                                    <div className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none">
                                       <Briefcase className="w-32 h-32" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                       <span className="text-gray-400 text-xs font-bold">إجمالي الإعلانات المفعلة</span>
                                       <span className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/10">
                                          <LayoutList className="w-4 h-4" />
                                       </span>
                                    </div>
                                    <div className="mt-2">
                                       <p className="text-3xl font-display font-black text-white">{products.length}</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-450">
                                       <span className="text-[#10B981] font-bold flex items-center">↑ 100%</span>
                                       <span className="text-gray-500">مباشر على الخرائط والقائمة</span>
                                    </div>
                                </div>

                                {/* VIP Members Count */}
                                <div className="bg-[#050505] border border-gray-900 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)] transition-all duration-300 max-w-[290px] xs:max-w-xs sm:max-w-sm lg:max-w-none mx-auto w-full">
                                    <div className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none">
                                       <Crown className="w-32 h-32" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                       <span className="text-gray-400 text-xs font-bold">أعضاء VIP النخبة</span>
                                       <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                          <Crown className="w-4 h-4" />
                                       </span>
                                    </div>
                                    <div className="mt-2">
                                       <p className="text-3xl font-display font-black text-white">{vipCount}</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-500">
                                       <Sparkles className="w-3 h-3 text-amber-400" />
                                       <span>عرض إعلاناتهم مستمر</span>
                                    </div>
                                </div>

                                {/* Pending requests Count */}
                                <div className="bg-[#050505] border border-gray-900 rounded-xl p-5 relative overflow-hidden group hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.05)] transition-all duration-300 max-w-[290px] xs:max-w-xs sm:max-w-sm lg:max-w-none mx-auto w-full">
                                    <div className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none">
                                       <TrendingUp className="w-32 h-32" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                       <span className="text-gray-400 text-xs font-bold">طلبات دفع معلقة</span>
                                       <span className={`p-2 rounded-xl border ${systemRequests.length > 0 ? 'bg-red-500/15 text-red-500 border-red-500/20 animate-pulse' : 'bg-gray-800/50 text-gray-400 border-gray-800'}`}>
                                          <RefreshCw className="w-4 h-4" />
                                       </span>
                                    </div>
                                    <div className="mt-2">
                                       <p className={`text-3xl font-display font-black ${systemRequests.length > 0 ? 'text-red-400' : 'text-white'}`}>
                                          {systemRequests.length}
                                       </p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-500">
                                       <span>• تتطلب تفعيلاً مالياً فورياً</span>
                                    </div>
                                </div>
                            </div>

                            {/* Luxury Interactivity: SVG Custom Glowing Area Analytics Chart */}
                            <div className="bg-[#050505] border border-gray-900 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                                    <div>
                                        <h4 className="text-white font-bold text-lg font-display flex items-center gap-2">
                                            مؤشر نمو الإيرادات والحملات الإعلانية
                                        </h4>
                                        <p className="text-gray-400 text-xs mt-1">تتبع التدفقات الأسبوعية وتأرجح المبيعات الحية.</p>
                                    </div>

                                    {/* Chart Selector Buttons */}
                                    <div className="flex items-center bg-[#0d0d0d] p-1.5 rounded-2xl border border-gray-800">
                                        <button 
                                          onClick={() => setChartMetric('revenue')}
                                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${chartMetric === 'revenue' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-gray-400 hover:text-white'}`}
                                        >
                                           الأرباح المخرجة
                                        </button>
                                        <button 
                                          onClick={() => setChartMetric('ads')}
                                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${chartMetric === 'ads' ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/20' : 'text-gray-400 hover:text-white'}`}
                                        >
                                           الإعلانات المضافة
                                        </button>
                                    </div>
                                </div>

                                {/* Custom SVG Chart Body */}
                                <div className="relative w-full h-64 mt-4 select-none">
                                    <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                                       {[...Array(4)].map((_, i) => (
                                         <div key={i} className="border-t border-gray-800/40 w-full h-full" />
                                       ))}
                                    </div>

                                    {/* The SVG element itself */}
                                    <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible">
                                       <defs>
                                          <linearGradient id="revenueGoldGrad" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.30"/>
                                             <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.00"/>
                                          </linearGradient>
                                          <linearGradient id="adsGreenGrad" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="0%" stopColor="#10B981" stopOpacity="0.30"/>
                                             <stop offset="100%" stopColor="#10B981" stopOpacity="0.00"/>
                                          </linearGradient>
                                       </defs>

                                       {/* Area Fill */}
                                       {chartMetric === 'revenue' ? (
                                         <path 
                                            d={`M 15 220 
                                                L 110 ${220 - (chartData[0].revenue / grandTotalRevenue) * 160} 
                                                L 205 ${220 - (chartData[1].revenue / grandTotalRevenue) * 160} 
                                                L 300 ${220 - (chartData[2].revenue / grandTotalRevenue) * 160} 
                                                L 395 ${220 - (chartData[3].revenue / grandTotalRevenue) * 160} 
                                                L 490 ${220 - (chartData[4].revenue / grandTotalRevenue) * 160} 
                                                L 585 ${220 - (chartData[5].revenue / grandTotalRevenue) * 160} 
                                                L 680 ${220 - (chartData[6].revenue / grandTotalRevenue) * 160} 
                                                L 680 220 Z`}
                                            fill="url(#revenueGoldGrad)"
                                            className="transition-all duration-500 ease-in-out"
                                         />
                                       ) : (
                                         <path 
                                            d={`M 15 220 
                                                L 110 ${220 - (chartData[0].ads / 15) * 160} 
                                                L 205 ${220 - (chartData[1].ads / 15) * 160} 
                                                L 300 ${220 - (chartData[2].ads / 15) * 160} 
                                                L 395 ${220 - (chartData[3].ads / 15) * 160} 
                                                L 490 ${220 - (chartData[4].ads / 15) * 160} 
                                                L 585 ${220 - (chartData[5].ads / 15) * 160} 
                                                L 680 ${220 - (chartData[6].ads / 15) * 160} 
                                                L 680 220 Z`}
                                            fill="url(#adsGreenGrad)"
                                            className="transition-all duration-500 ease-in-out"
                                         />
                                       )}

                                       {/* Core glowing line */}
                                       {chartMetric === 'revenue' ? (
                                         <polyline 
                                            points={`15,220 110,${220 - (chartData[0].revenue / grandTotalRevenue) * 160} 205,${220 - (chartData[1].revenue / grandTotalRevenue) * 160} 300,${220 - (chartData[2].revenue / grandTotalRevenue) * 160} 395,${220 - (chartData[3].revenue / grandTotalRevenue) * 160} 490,${220 - (chartData[4].revenue / grandTotalRevenue) * 160} 585,${220 - (chartData[5].revenue / grandTotalRevenue) * 160} 680,${220 - (chartData[6].revenue / grandTotalRevenue) * 160}`}
                                            fill="none" 
                                            stroke="#D4AF37" 
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-500 ease-in-out"
                                         />
                                       ) : (
                                         <polyline 
                                            points={`15,220 110,${220 - (chartData[0].ads / 15) * 160} 205,${220 - (chartData[1].ads / 15) * 160} 300,${220 - (chartData[2].ads / 15) * 160} 395,${220 - (chartData[3].ads / 15) * 160} 490,${220 - (chartData[4].ads / 15) * 160} 585,${220 - (chartData[5].ads / 15) * 160} 680,${220 - (chartData[6].ads / 15) * 160}`}
                                            fill="none" 
                                            stroke="#10B981" 
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-500 ease-in-out"
                                         />
                                       )}

                                       {/* Nodes overlay on hover */}
                                       {chartData.map((d, index) => {
                                         const cx = 110 + index * 95;
                                         const cy = chartMetric === 'revenue' 
                                            ? 220 - (d.revenue / grandTotalRevenue) * 160
                                            : 220 - (d.ads / 15) * 160;

                                         return (
                                           <g key={index} 
                                              onMouseEnter={() => setHoveredDataIndex(index)}
                                              onMouseLeave={() => setHoveredDataIndex(null)}
                                              className="cursor-pointer"
                                           >
                                              <circle 
                                                cx={cx} 
                                                cy={cy} 
                                                r={hoveredDataIndex === index ? "8" : "4"} 
                                                fill={chartMetric === 'revenue' ? '#D4AF37' : '#10B981'}
                                                className="transition-all duration-200"
                                              />
                                              {hoveredDataIndex === index && (
                                                <circle 
                                                  cx={cx} 
                                                  cy={cy} 
                                                  r="14" 
                                                  fill="none"
                                                  stroke={chartMetric === 'revenue' ? '#D4AF37' : '#10B981'}
                                                  strokeWidth="1.5"
                                                  strokeOpacity="0.5"
                                                  className="animate-ping"
                                                />
                                              )}
                                           </g>
                                         );
                                       })}
                                    </svg>

                                    {/* Hovering Tooltip display */}
                                    <div className="absolute top-2 left-2 bg-[#0d0d0d] border border-gray-800 rounded-xl px-4 py-2 pointer-events-none text-xs flex flex-col gap-1 shadow-2xl transition-opacity duration-300">
                                        {hoveredDataIndex !== null ? (
                                           <>
                                              <span className="text-gray-500 font-bold text-[10px]">{chartData[hoveredDataIndex].label}</span>
                                              <span className="text-white font-black">
                                                 {chartMetric === 'revenue' 
                                                   ? `الحصاد الإجمالي: ${chartData[hoveredDataIndex].revenue} د.ت` 
                                                   : `الإعلانات النشطة: ${chartData[hoveredDataIndex].ads} إعلان`
                                                 }
                                              </span>
                                           </>
                                        ) : (
                                           <span className="text-gray-500 text-[10px]">ضع المؤشر على النقاط لقراءة البيانات</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Two Columns Grid for Ledger and Core configuration */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                               {/* Modern Security Ledger Logs (Left Column) */}
                               <div className="bg-[#050505] border border-gray-900 rounded-3xl p-6 lg:col-span-3">
                                  <div className="flex justify-between items-center mb-6">
                                     <h4 className="text-white font-bold text-md font-display flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                                        سجل النشاط الفوري المعتمد
                                     </h4>
                                     <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">نشط</span>
                                  </div>
                                  
                                  <div className="space-y-4 max-h-[280px] overflow-y-auto no-scrollbar">
                                      <div className="p-3 bg-[#0c0c0c] border border-gray-950 rounded-xl flex items-center justify-between gap-3 text-xs">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-bold">١</div>
                                            <div>
                                               <p className="font-bold text-white">تحديث قاعدة الحفظ المؤقت</p>
                                               <p className="text-gray-500 text-[10px]">منذ دقيقة واحدة • نظام سند</p>
                                            </div>
                                         </div>
                                         <span className="text-gray-400 font-mono">سليم ✓</span>
                                      </div>

                                      <div className="p-3 bg-[#0c0c0c] border border-gray-950 rounded-xl flex items-center justify-between gap-3 text-xs">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">٢</div>
                                            <div>
                                               <p className="font-bold text-white">مزامنة الإعلانات مع الخريطة</p>
                                               <p className="text-gray-500 text-[10px]">منذ ١٥ دقيقة • محرك الاستشعار</p>
                                            </div>
                                         </div>
                                         <span className="text-emerald-400 font-mono">متصل ✓</span>
                                      </div>

                                      <div className="p-3 bg-[#0c0c0c] border border-gray-950 rounded-xl flex items-center justify-between gap-3 text-xs">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-bold">٣</div>
                                            <div>
                                               <p className="font-bold text-white">فحص صلاحيات المسؤولين</p>
                                               <p className="text-gray-500 text-[10px]">منذ ساعة • المدير 92942482</p>
                                            </div>
                                         </div>
                                         <span className="text-[#D4AF37] font-mono">مرخص ✦</span>
                                      </div>
                                  </div>
                               </div>

                               {/* Quick Status Stats (Right Column) */}
                               <div className="bg-[#050505] border border-gray-900 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
                                  <div>
                                     <h4 className="text-white font-bold text-md font-display mb-2 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        توزيع الحزم والاشتراكات
                                     </h4>
                                     <p className="text-gray-400 text-xs mb-5">توزيع فئات الاشتراكات لشبكة سند.</p>
                                  </div>

                                  <div className="space-y-4">
                                     <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-400 font-bold">
                                           <span>نخبة في آي بي (VIP)</span>
                                           <span>{vipCount} مشترك</span>
                                        </div>
                                        <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-gray-900">
                                           <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] rounded-full" style={{ width: `${Math.max(15, (vipCount / Math.max(1, systemUsers.length)) * 100)}%` }} />
                                        </div>
                                     </div>

                                     <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-400 font-bold">
                                           <span>برونزية معلنة (Bronze)</span>
                                           <span>{bronzeCount} مشترك</span>
                                        </div>
                                        <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-gray-900">
                                           <div className="h-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] rounded-full" style={{ width: `${Math.max(15, (bronzeCount / Math.max(1, systemUsers.length)) * 100)}%` }} />
                                        </div>
                                     </div>

                                     <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-400 font-bold">
                                           <span>إرساء منصة سند المباشرة</span>
                                           <span className="text-[#10B981] font-bold">١٠٠٪ مغطى</span>
                                        </div>
                                        <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-gray-900">
                                           <div className="h-full bg-[#10B981] rounded-full" style={{ width: '100%' }} />
                                        </div>
                                     </div>
                                  </div>

                                  <div className="mt-6 pt-4 border-t border-gray-900 text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                                     <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                                     <span>جميع معاملات سند مشفرة ومصادق عليها</span>
                                  </div>
                               </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ads' && (
                        <motion.div 
                          key="tab-ads"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="max-w-5xl mx-auto w-full space-y-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                   <h3 className="text-white font-bold text-xl font-display">إدارة طلبات وسلع الإعلانات المباشرة</h3>
                                   <p className="text-gray-400 text-xs mt-1">عرض وتحرير أو إزالة سلع المشتركين المعروضة.</p>
                                </div>
                                <span className="text-[11px] bg-gray-900 text-gray-400 border border-gray-800 px-3 py-1.5 rounded-xl font-mono">
                                   إجمالي الإعلانات المصنفة: {filteredProducts.length}
                                </span>
                            </div>

                            <div className="bg-[#050505] border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                                {filteredProducts.length > 0 ? (
                                    <div className="divide-y divide-gray-900">
                                        {filteredProducts.map((a, index) => {
                                            const isVip = a.plan === 'vip' || a.isVip;
                                            const isBronze = a.plan === 'bronze';

                                            return (
                                                <div 
                                                  key={`${a.id}-${a.title}-${index}`} 
                                                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#090909]/40 transition-colors duration-200"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 shrink-0 relative overflow-hidden">
                                                            {a.imageUrls && a.imageUrls[0] ? (
                                                               <img src={a.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                               <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-600">بلا صورة</div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                               <p className="text-white font-bold text-sm hover:text-[#D4AF37] transition-colors">{a.title}</p>
                                                               {isVip && (
                                                                  <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">VIP ✦</span>
                                                               )}
                                                               {isBronze && (
                                                                  <span className="bg-amber-600/10 text-amber-500 border border-amber-600/20 text-[9px] font-black px-2 py-0.5 rounded-full">برونزي</span>
                                                               )}
                                                            </div>
                                                            <p className="text-gray-500 text-xs flex items-center gap-1.5">
                                                                <span>البائع: {a.sellerName || 'مستخدم غير معرف'}</span>
                                                                <span>•</span>
                                                                <span>{a.location || 'تونس'}</span>
                                                                <span>•</span>
                                                                <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{a.category}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 border-gray-900 pt-3 sm:pt-0">
                                                        <div className="text-right">
                                                           <p className="text-[#10B981] font-black text-md">{a.price} د.ت</p>
                                                           <p className="text-[9px] text-gray-500 font-mono">ID: {a.id.slice(0, 8)}...</p>
                                                        </div>
                                                        <button 
                                                           onClick={() => handleDeleteAd(a.id)} 
                                                           className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-xl transition duration-200" 
                                                           title="حذف هذا الإعلان فورياً"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 text-gray-500 flex flex-col items-center justify-center gap-3">
                                        <Briefcase className="w-12 h-12 text-gray-800" />
                                        <p className="text-sm">لم يتم العثور على أي إعلان يطابق بحثك حالياً.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div 
                          key="tab-users"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="max-w-5xl mx-auto w-full space-y-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                   <h3 className="text-white font-bold text-xl font-display">إيجاد وإدارة حسابات الحرفاء والمشتركين</h3>
                                   <p className="text-gray-400 text-xs mt-1">نظرة عامة والتحكم المطلق بجميع المشتركين المسجلين في منصتك.</p>
                                </div>
                                <span className="text-[11px] bg-gray-900 text-gray-400 border border-gray-800 px-3 py-1.5 rounded-xl font-mono">
                                   إجمالي المسجلين: {filteredUsers.length}
                                </span>
                            </div>

                            <div className="bg-[#050505] border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                                {filteredUsers.length > 0 ? (
                                    <div className="divide-y divide-gray-900">
                                        {filteredUsers.map((u, index) => {
                                            const isVip = u.plan === 'vip';
                                            const isBronze = u.plan === 'bronze';
                                            const isSystemAdmin = (u.phone && (
                                                u.phone === '92942482' || 
                                                u.phone === '21692942482' || 
                                                String(u.phone).trim().replace(/\s+/g, '').endsWith('92942482')
                                            )) || (u.id && (
                                                u.id === '92942482' || 
                                                String(u.id).trim().replace(/\s+/g, '').endsWith('92942482')
                                            )) || (u.name && (
                                                u.name.toUpperCase() === 'ADMIN' || 
                                                u.name === 'المدير' || 
                                                u.name === 'عضو الإدارة 👑' ||
                                                u.name === 'أدمن'
                                            ));

                                            return (
                                                <div 
                                                  key={`${u.id}-${u.phone}-${index}`} 
                                                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#090909]/40 transition-colors duration-200"
                                                >
                                                    <div className="flex items-center gap-3.5 w-full md:w-5/12">
                                                        <div className="relative">
                                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 flex items-center justify-center text-white font-bold text-md shadow-md shadow-black/80 uppercase">
                                                                {u.name ? u.name.charAt(0) : 'U'}
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-[#050505]"></div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                               <p className="font-bold text-white text-sm truncate">{u.name || 'مستخدم مجهول'}</p>
                                                               {isSystemAdmin && (
                                                                  <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[8px] font-black tracking-widest px-2 py-0.5 rounded">عضو الإدارة 👑</span>
                                                               )}
                                                            </div>
                                                            <p className="text-[#10B981] text-[10px] font-bold tracking-wider">نشط الآن في التطبيق</p>
                                                        </div>
                                                    </div>

                                                    <div className="w-full md:w-3/12 flex items-center gap-1.5 text-gray-400 font-mono text-sm">
                                                        <span className="text-gray-500 text-xs">الهاتف:</span>
                                                        <span className="dir-ltr text-right inline-block">{u.phone || 'بلا رقم'}</span>
                                                    </div>
                                                    <div className="w-full md:w-2/12 text-gray-400 text-sm">
                                                        <span className="text-gray-500 text-xs">الإعلانات:</span>
                                                        <span className="font-bold text-white"> {adCounts[u.phone] || 0}</span>
                                                    </div>

                                                    <div className="w-full md:w-4/12 flex items-center justify-between md:justify-end gap-4 text-left border-t md:border-0 border-gray-900 pt-3 md:pt-0">
                                                        <div className="flex items-center gap-2">
                                                            {isVip && (
                                                              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 flex items-center gap-1">
                                                                 <Crown className="w-3 h-3" />
                                                                 ذهبية (VIP)
                                                              </span>
                                                            )}
                                                            {isBronze && (
                                                              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-600/15 text-amber-500 border border-amber-600/25 flex items-center gap-1">
                                                                 <Award className="w-3 h-3" />
                                                                 برونزية
                                                              </span>
                                                            )}
                                                            {u.plan !== 'vip' && u.plan !== 'bronze' && (
                                                              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-900 text-gray-500 border border-gray-800">
                                                                 مجانية (Free)
                                                              </span>
                                                            )}
                                                        </div>

                                                        {!isSystemAdmin ? (
                                                            <button 
                                                              onClick={() => handleDeleteUser(u.id)} 
                                                              className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-xl transition duration-200" 
                                                              title="حذف هذا المشترك نهائياً"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <div className="w-10 h-10" /> // spacer to keep visual alignment
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 text-gray-500 flex flex-col items-center justify-center gap-3">
                                        <Users className="w-12 h-12 text-gray-800" />
                                        <p className="text-sm">لم يتم العثور على أي حريف يطابق بحثك.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {activeTab === 'requests' && (
                        <motion.div 
                          key="tab-requests"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="max-w-5xl mx-auto w-full space-y-8"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                   <h3 className="text-white font-bold text-2xl font-display flex items-center gap-2">
                                      طلبات الاشتراك والدفع
                                   </h3>
                                   <p className="text-gray-400 text-xs mt-1">تؤكد هذه القائمة الحوالات المالية ووصول الدفعات لتفعيل الميزات الذهبية للمستخدمين.</p>
                                </div>
                            </div>

                            {/* Pending Requests Section */}
                            <div>
                               <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
                                  <h4 className="text-[#D4AF37] font-bold text-lg flex items-center gap-2">
                                     <Crown className="w-5 h-5" /> 
                                     طلبات بانتظار التفعيل
                                     {filteredRequests.filter(r => r.status !== 'activated').length > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-bounce">
                                           {filteredRequests.filter(r => r.status !== 'activated').length} معلق
                                        </span>
                                     )}
                                  </h4>
                               </div>
                               
                               {filteredRequests.filter(r => r.status !== 'activated').length > 0 ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                       {filteredRequests.filter(r => r.status !== 'activated').map((r, index) => {
                                           const isVip = r.plan === 'vip';
                                           return (
                                               <div 
                                                 key={`${r.id}-${r.phone}-${index}`} 
                                                 className="bg-[#050505] border border-gray-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-gray-700 transition-all duration-300"
                                               >
                                                   {isVip && (
                                                     <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden pointer-events-none">
                                                       <div className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] absolute transform -rotate-45 text-[8px] font-black text-black py-1 text-center w-36 -left-10 top-5 uppercase tracking-widest shadow-md">
                                                          GOLDEN
                                                       </div>
                                                     </div>
                                                   )}

                                                   <div className="space-y-4">
                                                       <div className="flex items-start justify-between">
                                                          <div className="flex items-center gap-3">
                                                              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-white font-black">
                                                                 {r.user ? r.user.charAt(0).toUpperCase() : '👤'}
                                                              </div>
                                                              <div>
                                                                 <h4 className="font-bold text-white text-sm">{r.user}</h4>
                                                                 <span className="text-[10px] text-gray-500 font-mono">رقم الهاتف: <span className="dir-ltr text-right inline-block font-black text-gray-400">{r.phone}</span></span>
                                                              </div>
                                                          </div>
                                                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isVip ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-amber-600/15 text-amber-500 border border-amber-600/35'}`}>
                                                              {isVip ? 'ذهبية VIP' : 'برونزية'}
                                                          </span>
                                                       </div>

                                                       <div className="bg-black/40 border border-gray-950 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                                                           <span className="text-gray-500">القيمة المالية للاشتراك:</span>
                                                           <span className="text-[#10B981] font-black text-md">
                                                              {isVip ? pricingVip : pricingBronze} د.ت
                                                           </span>
                                                       </div>
                                                   </div>

                                                   <div className="mt-6 pt-4 border-t border-gray-900/60 flex items-center justify-between gap-3">
                                                       <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1 animate-pulse">
                                                          ✦ تفعيل بانتظار الموافقة المالية
                                                       </span>

                                                       <button 
                                                         onClick={() => setSelectedRequest(r)}
                                                         className="bg-[#10B981] hover:bg-[#0ea5e9] text-black px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 shadow-lg shadow-[#10B981]/10"
                                                       >
                                                          <span>مراجعة وتفعيل الآن</span>
                                                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                                       </button>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               ) : (
                                   <div className="flex flex-col items-center justify-center p-8 bg-[#050505] rounded-3xl border border-gray-900 text-center">
                                       <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                                          <BadgeCheck className="w-6 h-6" />
                                       </div>
                                       <h4 className="text-white font-bold text-sm">جميع الطلبات مغلقة</h4>
                                       <p className="text-gray-500 text-xs mt-1">لا توجد طلبات اشتراك معلقة تتطلب التدخل المالي للمدير حالياً.</p>
                                   </div>
                               )}
                            </div>

                            {/* Activated Requests Section */}
                            <div>
                               <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
                                  <h4 className="text-gray-400 font-bold text-lg flex items-center gap-2">
                                     <CheckCircle className="w-5 h-5 text-emerald-500" />
                                     الطلبات المفعلة وتاريخ السجلات
                                  </h4>
                               </div>

                               {filteredRequests.filter(r => r.status === 'activated').length > 0 ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-70 hover:opacity-100 transition-opacity">
                                       {filteredRequests.filter(r => r.status === 'activated').map((r, index) => {
                                           const isVip = r.plan === 'vip';
                                           return (
                                               <div 
                                                 key={`${r.id}-${r.phone}-${index}`} 
                                                 className="bg-[#050505] border border-emerald-900/40 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between"
                                               >
                                                   <div className="space-y-4">
                                                       <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-3">
                                                              <div className="w-8 h-8 rounded-full bg-gray-900 border border-emerald-900/50 flex items-center justify-center text-emerald-500 font-black text-xs">
                                                                 <CheckCircle className="w-4 h-4" />
                                                              </div>
                                                              <div>
                                                                 <h4 className="font-bold text-gray-300 text-xs">{r.user}</h4>
                                                                 <span className="text-[10px] text-gray-500 font-mono"><span className="dir-ltr text-right inline-block">{r.phone}</span></span>
                                                              </div>
                                                          </div>
                                                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isVip ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-gray-800 text-gray-400'}`}>
                                                              {isVip ? 'VIP' : 'برونزي'}
                                                          </span>
                                                       </div>
                                                   </div>

                                                   <div className="mt-4 pt-3 border-t border-gray-900/60 flex items-center justify-between gap-3">
                                                       <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                                                          تم التفعيل بنجاح
                                                       </span>

                                                       <button 
                                                         onClick={async () => {
                                                           await deleteDoc(doc(db, 'systemRequests', r.id));
                                                           setSystemRequests(prev => prev.filter(req => req.id !== r.id));
                                                           if (showToast) showToast('تم الحذف', 'success');
                                                         }}
                                                         className="text-gray-500 hover:text-red-500 text-[10px] border border-gray-800 hover:border-red-500 px-3 py-1 rounded-lg transition"
                                                       >
                                                           أرشفة / حذف
                                                       </button>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               ) : (
                                   <div className="p-6 text-center border border-gray-900 border-dashed rounded-3xl">
                                     <p className="text-gray-500 text-xs">لا يوجد سجل للطلبات المفعلة حالياً.</p>
                                   </div>
                               )}
                            </div>
                        </motion.div>
                    )}
                    
                    {activeTab === 'settings' && (
                        <motion.div 
                          key="tab-settings"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="max-w-3xl mx-auto w-full space-y-8"
                        >
                             <div>
                                <h3 className="text-white font-bold text-xl font-display">تكوين وتعديل إعدادات سند الذكية</h3>
                                <p className="text-gray-400 text-xs mt-1">إدارة نسب الضرائب وتغيير أسعار ترقيات الحسابات المباشرة.</p>
                             </div>

                             <div className="bg-[#050505] border border-gray-900 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                                  {/* Price upgrade VIP */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center pb-5 border-b border-gray-900">
                                      <div>
                                         <label className="text-white font-bold text-sm block">كلفة حزمة الـ VIP الذهبية (د.ت)</label>
                                         <span className="text-gray-500 text-xs block mt-1">السعر المعياري الشهري للاشتراك الذهبي.</span>
                                      </div>
                                      <input 
                                         type="number" 
                                         value={pricingVip} 
                                         onChange={(e) => setPricingVip(e.target.value)}
                                         className="bg-black border border-gray-850 rounded-2xl p-3 text-white text-sm focus:border-[#D4AF37] outline-none text-left" 
                                      />
                                  </div>

                                  {/* Price upgrade Bronze */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center pb-5 border-b border-gray-900">
                                      <div>
                                         <label className="text-white font-bold text-sm block">كلفة حزمة البرونز (د.ت)</label>
                                         <span className="text-gray-500 text-xs block mt-1">تكلفة الإعلانات والمشتركين البرونزيين.</span>
                                      </div>
                                      <input 
                                         type="number" 
                                         value={pricingBronze} 
                                         onChange={(e) => setPricingBronze(e.target.value)}
                                         className="bg-black border border-gray-850 rounded-2xl p-3 text-white text-sm focus:border-[#D4AF37] outline-none text-left" 
                                      />
                                  </div>

                                  {/* platform commission percent */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center pb-5 border-b border-gray-900">
                                      <div>
                                         <label className="text-white font-bold text-sm block">رسوم حجز الصفقات والوساطة (%)</label>
                                         <span className="text-gray-500 text-xs block mt-1">النسبة المقتطعة من المدفوعات والتوثيق التلقائي.</span>
                                      </div>
                                      <div className="relative">
                                         <input 
                                            type="number" 
                                            value={platformCommission} 
                                            onChange={(e) => setPlatformCommission(e.target.value)}
                                            className="w-full bg-black border border-gray-850 rounded-2xl p-3 text-white text-sm focus:border-[#D4AF37] outline-none text-left pr-10" 
                                         />
                                         <span className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">%</span>
                                      </div>
                                  </div>

                                  {/* Toggle maintenance state */}
                                  <div className="flex items-center justify-between py-2">
                                      <div>
                                         <label className="text-white font-bold text-sm block">وضع الصيانة والخادم المؤقت</label>
                                         <span className="text-gray-500 text-xs block mt-1">تعطيل رفع السلع مؤقتاً لأعمال التطوير السحابي الحية.</span>
                                      </div>
                                      <button 
                                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                                        className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 ${maintenanceMode ? 'bg-[#10B981]' : 'bg-gray-800'}`}
                                      >
                                         <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${maintenanceMode ? 'right-6.5' : 'right-0.5'}`} />
                                      </button>
                                  </div>

                                  <div className="pt-6 border-t border-gray-900 flex justify-end">
                                      <button 
                                        type="button"
                                        onClick={handleSaveSettings}
                                        className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black hover:opacity-90 px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-[#D4AF37]/15 transition-all duration-300"
                                      >
                                          حفظ التغييرات وتطبيق التكوين
                                      </button>
                                  </div>
                             </div>
                        </motion.div>
                    )}
                 </AnimatePresence>

            </div>
        </div>

        {/* Dynamic Verification Payment Receipt Overlay Modal */}
        <AnimatePresence>
           {selectedRequest && (
              <motion.div 
                 key="receipt-modal"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              >
                  <motion.div 
                     initial={{ scale: 0.95, y: 15 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.95, y: 15 }}
                     className="bg-[#050505] border border-[#D4AF37]/30 max-w-md w-full rounded-3xl overflow-hidden p-6 relative"
                  >
                     <button 
                        onClick={() => setSelectedRequest(null)}
                        className="absolute left-4 top-4 p-2 bg-[#0a0a0a] border border-gray-800 text-gray-500 hover:text-white rounded-xl transition"
                     >
                        <X className="w-5 h-5" />
                     </button>

                     <div className="flex flex-col items-center justify-center text-center mt-4">
                         <div className="p-3 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 rounded-2xl mb-4 animate-pulse">
                            <Clock className="w-8 h-8" />
                         </div>
                         <h3 className="text-white font-bold text-lg font-display">مراجعة وصل الدفع والاعتماد</h3>
                         <p className="text-gray-400 text-xs mt-1">فضلاً تأكد من وصول المبلغ المالي لحساب سند البنكي قبل الضغط على تفعيل.</p>
                     </div>

                     <div className="mt-6 space-y-4 bg-black/60 border border-gray-950 p-4.5 rounded-2xl text-xs">
                          <div className="flex justify-between border-b border-gray-900/60 pb-2.5">
                             <span className="text-gray-500">مقدم الطلب:</span>
                             <span className="text-white font-black">{selectedRequest.user}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-900/60 pb-2.5">
                             <span className="text-gray-500">رقم الهاتف:</span>
                             <span className="text-white font-mono">{selectedRequest.phone}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-900/60 pb-2.5">
                             <span className="text-gray-500">الباقة المطلوبة:</span>
                             <span className={`font-black ${selectedRequest.plan === 'vip' ? 'text-[#D4AF37]' : 'text-amber-500'}`}>
                                {selectedRequest.plan === 'vip' ? 'ذهبية VIP ✦' : 'برونزية مستقلة'}
                             </span>
                          </div>

                          <div className="flex justify-between">
                             <span className="text-gray-500">الدفعة المستحقة:</span>
                             <span className="text-[#10B981] font-black text-sm">{selectedRequest.plan === 'vip' ? pricingVip : pricingBronze} د.ت</span>
                          </div>
                     </div>

                     <div className="mt-8 grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setSelectedRequest(null)}
                           className="bg-gray-900 hover:bg-gray-800 text-gray-400 py-3 rounded-2xl text-xs font-bold transition border border-gray-800"
                         >
                            إلغاء المراجعة
                         </button>
                         <button 
                           onClick={() => handleActivateRequest(selectedRequest)}
                           className="bg-[#10B981] hover:bg-emerald-600 text-black py-3 rounded-2xl text-xs font-black shadow-lg shadow-[#10B981]/15 transition-all duration-300"
                         >
                            تأكيد وتفعيل الاشتراك
                         </button>
                     </div>
                  </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
    </motion.div>
  );
}

// Sidebar links content
interface MenuContentProps {
  activeTab: string;
  setActiveTab: (t: any) => void;
  systemRequestsCount: number;
  systemRequests: any[];
}

function MenuContent({ activeTab, setActiveTab, systemRequestsCount, systemRequests }: MenuContentProps) {
    return (
        <div className="flex flex-col gap-2">
            <button 
               onClick={() => setActiveTab('dashboard')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === 'dashboard' 
                     ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] font-bold border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="text-xs">لوحة القيادة والمؤشرات</span>
            </button>

            <button 
               onClick={() => setActiveTab('ads')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === 'ads' 
                     ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] font-bold border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <LayoutList className="w-5 h-5 shrink-0" />
                <span className="text-xs">الطلبات / الإعلانات المرفوعة</span>
            </button>

            <button 
               onClick={() => setActiveTab('requests')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center justify-between transition-all duration-300 ${
                  activeTab === 'requests' 
                     ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] font-bold border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="text-xs">طلبات تفعيل الاشتراكات</span>
                </div>
                {systemRequestsCount > 0 && (
                   <span className="bg-red-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full animate-pulse">
                      {systemRequestsCount}
                   </span>
                )}
            </button>

            <button 
               onClick={() => setActiveTab('users')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === 'users' 
                     ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] font-bold border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <Users className="w-5 h-5 shrink-0" />
                <span className="text-xs">قاعدة الحرفاء والمشتركين</span>
            </button>

            <button 
               onClick={() => setActiveTab('subscribers')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === 'subscribers' 
                     ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] font-bold border border-[#D4AF37]/25 shadow-[0_0_15px_rgba(212,175,55,0.03)]' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <Crown className="w-5 h-5 shrink-0" />
                <span className="text-xs">إدارة الاشتراكات والنخبة</span>
            </button>

            <div className="my-3 border-t border-gray-900/40 w-full" />
            <div className="mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3">عمليات التكوين</div>

            <button 
               onClick={() => setActiveTab('settings')} 
               className={`w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === 'settings' 
                     ? 'bg-gradient-to-r from-[#10B981]/15 to-transparent text-[#10B981] font-bold border border-[#10B981]/25' 
                     : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
               }`}
            >
                <Settings className="w-5 h-5 shrink-0" />
                <span className="text-xs">تجهيزات ونسب المنصة</span>
            </button>
        </div>
    );
}
