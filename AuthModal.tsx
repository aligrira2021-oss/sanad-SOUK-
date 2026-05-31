import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Phone, User, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  key?: React.Key;
  onClose: () => void;
  onAuth: (isLogin: boolean, phone: string, name: string, code: string) => boolean | string | Promise<boolean | string>;
}

export default function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#050505] rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-sm relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-bold font-display text-white mb-2">
                {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </h2>
            <p className="text-sm text-gray-400">
                {isLogin ? 'مرحباً بعودتك إلى سوق سند' : 'انضم إلى منصة النخبة'}
            </p>
        </div>

        {errorMsg && (
            <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg text-center mb-4 border border-red-500/20">
                {errorMsg}
            </div>
        )}

        <form className="space-y-4 text-right" dir="rtl" onSubmit={async (e) => { 
          e.preventDefault(); 
          if (loading) return;
          setErrorMsg('');
          
          if (!isLogin) {
            if (code !== confirmCode) {
              setErrorMsg('الكود غير متطابق');
              return;
            }
            if (code.length !== 8) {
              setErrorMsg('يجب أن يتكون الكود من 8 أرقام');
              return;
            }
            if (!agreed) {
              setErrorMsg('يرجى الموافقة على الشروط والأحكام');
              return;
            }
          }

          setLoading(true);
          try {
            const result = await onAuth(isLogin, phone, name, code);
            if (result !== true) {
                setErrorMsg(typeof result === 'string' ? result : (isLogin ? 'بيانات الدخول غير صحيحة' : 'رقم الهاتف مسجل مسبقاً'));
            }
          } catch(err: any) {
              console.error('Auth error:', err);
              setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال');
          } finally {
              setLoading(false);
          }
        }}>
          {!isLogin && (
            <div className="relative">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="w-full bg-[#020806] border border-gray-800 rounded-xl py-3 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none" disabled={loading} required={!isLogin} />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="relative">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full bg-[#020806] border border-gray-800 rounded-xl py-3 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none text-right" dir="auto" disabled={loading} required />
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>

          <div className="relative">
            <input 
              type={showCode ? "text" : "password"} 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="كود الدخول (8 أرقام)" 
              maxLength={8}
              className="w-full bg-[#020806] border border-gray-800 rounded-xl py-3 pr-12 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all text-right" 
              disabled={loading}
              required 
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              disabled={loading}
            >
              {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <input 
                  type={showCode ? "text" : "password"} 
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="تأكيد كود الدخول" 
                  maxLength={8}
                  className="w-full bg-[#020806] border border-gray-800 rounded-xl py-3 pr-12 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all text-right" 
                  disabled={loading}
                  required 
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>

              <div className="flex items-center gap-2 px-1 py-1">
                <button 
                  type="button" 
                  onClick={() => !loading && setAgreed(!agreed)}
                  className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${agreed ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-gray-700 hover:border-gray-500'} ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={loading}
                >
                  {agreed && <CheckCircle2 className="w-4 h-4 text-black" />}
                </button>
                <span className="text-xs text-gray-400 select-none">
                  أوافق على <button type="button" className="text-[#D4AF37] hover:underline" disabled={loading}>الشروط والأحكام</button> وسياسة الخصوصية
                </span>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold rounded-xl py-3 shadow-lg shadow-[#D4AF37]/20 transition-all mt-2 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
             {loading ? (
               <>
                 <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                 <span>جاري التحميل...</span>
               </>
             ) : (
               isLogin ? 'دخول' : 'إنشاء حساب'
             )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
           {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
           <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-[#D4AF37] font-bold hover:underline">
              {isLogin ? 'سجل الآن' : 'تسجيل الدخول'}
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
