import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Smartphone, CreditCard, Send, CheckCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentModal({ packageId, onClose, onConfirm }: { packageId: string; onClose: () => void, onConfirm: () => void }) {
    const [confirmed, setConfirmed] = useState(false);

    if (confirmed) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
                dir="rtl"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#050505] border border-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative text-center"
                >
                    <button onClick={onClose} className="absolute top-3 left-3 p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                    <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
                    <h2 className="text-xl font-bold font-display text-white mb-2 text-center">تم ترقية حسابكم بنجاح</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed px-2">سيتم تفعيل اشتراكك فور تأكيد التحويل من طرف إدارة سوق سند.</p>
                    <button onClick={onClose} className="w-full bg-[#10B981] text-white font-bold rounded-xl py-2.5 text-sm shadow-lg shadow-[#10B981]/25 hover:opacity-90 transition-opacity">
                        حسناً
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-hidden"
          onClick={onClose}
          dir="rtl"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#050505] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header (Sticky) */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800/80 shrink-0">
              <span className="w-8"></span> {/* Balancer */}
              <h2 className="text-lg font-bold font-display text-white text-center">طرق الدفع لتفعيل الباقة</h2>
              <button 
                onClick={onClose} 
                className="p-1.5 bg-gray-900/80 rounded-full text-gray-400 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content (Scrollable) */}
            <div className="overflow-y-auto p-3 sm:p-4 space-y-2.5 flex-1 scrollbar-hide">
                <div className="bg-gray-900/40 border border-gray-800 py-2.5 px-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                        <Smartphone className="w-5 h-5 text-[#10B981]" />
                        <h3 className="text-base font-bold text-white mb-0">تطبيق D17 (البريد التونسي)</h3>
                    </div>
                    <p className="text-gray-400 mb-1.5 text-xs">أرسل المبلغ المطلوب إلى رقم التحويل:</p>
                    <div className="text-lg font-bold text-white tracking-widest bg-black/80 py-1.5 px-4 text-center rounded-xl border border-gray-800 dir-ltr inline-block mx-auto min-w-[130px]">
                        92942482
                    </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-800 py-2.5 px-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                        <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                        <h3 className="text-base font-bold text-white mb-0">التحويل البريدي (e-Dinar)</h3>
                    </div>
                    <p className="text-gray-400 mb-1.5 text-xs">إيداع الأموال في بطاقة رقم:</p>
                    <div className="text-sm sm:text-base font-bold text-white tracking-widest bg-black/80 py-1.5 px-3 sm:px-4 text-center rounded-xl border border-gray-800 dir-ltr inline-block mx-auto max-w-full">
                        5359402040714234
                    </div>
                </div>

                <div className="bg-[#10B981]/5 border border-[#10B981]/20 py-2.5 px-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-[#10B981] font-bold text-xs sm:text-sm mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>خطوة هامة جداً لتأكيد طلبك</span>
                    </div>
                    <p className="text-gray-400 text-[11px] sm:text-xs leading-relaxed">
                        الرجاء إرسال وصل الدفع أو لقطة شاشة للتحويل لمشرف القسم على واتساب رقم:
                    </p>
                    <div className="text-base font-bold text-white tracking-wide mt-1 mb-2 dir-ltr">
                        92942482
                    </div>
                    
                    <button 
                       onClick={() => {
                          try {
                             confetti({
                                particleCount: 150,
                                spread: 80,
                                origin: { y: 0.6 }
                             });
                          } catch (e) {
                             console.error('Confetti error:', e);
                          }
                          setConfirmed(true);
                          onConfirm();
                       }} 
                       className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs sm:text-sm font-extrabold rounded-xl py-2.5 shadow-md shadow-[#10B981]/15 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        تأكيد الدفع وإرسال الإشعار للإدارة
                    </button>
                </div>
            </div>
          </motion.div>
        </motion.div>
      );
}
