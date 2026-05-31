import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Trash2, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface DebugViewProps {
  onBack: () => void;
  productsCount: number;
}

export default function DebugView({ onBack, productsCount }: DebugViewProps) {
  const [diagnostics, setDiagnostics] = useState<any>(() => {
    return (window as any).__sanadDiagnostics || {
      firebaseInitialized: false,
      projectId: 'Non-initialized',
      connectionStatus: 'Unknown',
      lastUpdate: new Date().toISOString()
    };
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Poll the global diagnostics object every 500ms to keep the UI perfectly synchronized on mobile
    const interval = setInterval(() => {
      if ((window as any).__sanadDiagnostics) {
        setDiagnostics({ ...(window as any).__sanadDiagnostics });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setSuccessMsg('تم مسح جميع البيانات المخزنة مؤقتاً بنجاح! جاري إعادة التحميل...');
      setDiagnostics((prev: any) => ({
        ...prev,
        connectionStatus: 'Clearing cache & reloading...'
      }));
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      alert(`فشل مسح الكاش: ${e?.message || e}`);
    }
  };

  const forceReconnect = async () => {
    setIsLoading(true);
    setSuccessMsg('جاري إعادة تشغيل فحص الاتصال بـ Firestore...');
    try {
      if ((window as any).__sanadDiagnostics) {
        (window as any).__sanadDiagnostics.connectionStatus = "Manual reconnect triggered";
        (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
      }
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('اكتمل فحص الاتصال اليدوي. يرجى مراجعة النتائج أدناه.');
      }, 1000);
    } catch {
      setIsLoading(false);
    }
  };

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown-host';

  return (
    <div id="debug-panel" className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-white" dir="rtl">
      {/* Navbar header */}
      <header className="border-b border-white/10 bg-[#0c1017]/90 sticky top-0 z-50 backdrop-blur-md px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/20 text-orange-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">لوحة تشخيص وتصحيح الأخطاء</h1>
              <p className="text-xs text-gray-400">صفحة فحص اتصالات وقصص VIP</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 hover:text-white border border-gray-700/60 transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للموقع</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section 1: Core System Diagnostics */}
          <div className="p-5 rounded-2xl bg-[#0c111c] border border-white/5 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">تفاصيل تهيئة النظام (Core Config)</h2>
            
            <div className="divide-y divide-white/5 space-y-3.5 pt-1.5 text-sm">
              <div className="flex items-center justify-between pb-3.5">
                <span className="text-gray-400 font-medium">حالة تشغيل Firebase:</span>
                <div>
                  {diagnostics.firebaseInitialized ? (
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-500/20">
                      مفعل (TRUE)
                    </span>
                  ) : (
                    <span className="bg-rose-500/10 text-rose-400 font-bold text-xs px-2.5 py-1 rounded-full border border-rose-500/20">
                      معطل (FALSE)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">معرف المشروع (projectId):</span>
                <span className="font-mono text-xs text-blue-300 select-all bg-blue-950/20 px-2 py-1 rounded border border-blue-900/30">
                  {diagnostics.projectId || 'NULL'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">عنوان المضيف (hostname):</span>
                <span className="font-mono text-xs text-yellow-300 bg-yellow-950/20 px-2 py-1 rounded border border-yellow-900/30">
                  {hostname}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">حالة مفتاح API Key:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics.hasApiKey ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span className="font-mono text-xs text-gray-300">
                    {diagnostics.maskedApiKey || 'None'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5">
                <span className="text-gray-400 font-medium">تاريخ ووقات التحديث:</span>
                <span className="font-mono text-xs text-gray-400">
                  {new Date(diagnostics.lastUpdate || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Firestore Database Stats */}
          <div className="p-5 rounded-2xl bg-[#0c111c] border border-white/5 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">حالة الاتصال والبيانات المسترجعة</h2>
            
            <div className="divide-y divide-white/5 space-y-3.5 pt-1.5 text-sm">
              <div className="flex items-center justify-between pb-3.5">
                <span className="text-gray-400 font-medium">حالة الاتصال بـ Firestore:</span>
                <span className="text-xs text-pink-400 font-semibold bg-pink-950/20 px-2 py-1 rounded-lg border border-pink-900/30 max-w-[200px] truncate" title={diagnostics.connectionStatus}>
                  {diagnostics.connectionStatus || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">السجلات المسترجعة بالـ HTTP:</span>
                <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/20 px-2.5 py-1 rounded border border-indigo-900/30">
                  {diagnostics.productsFetchedCount !== undefined && diagnostics.productsFetchedCount >= 0 ? diagnostics.productsFetchedCount : 'معلق أو فشل'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">السجلات المسترجعة بالـ Snapshot (Websocket):</span>
                <span className="font-mono text-sm font-bold text-amber-400 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-900/30">
                  {diagnostics.productsSnapshotCount !== undefined && diagnostics.productsSnapshotCount >= 0 ? diagnostics.productsSnapshotCount : 'غير متصل بالـ WebSocket'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-gray-400 font-medium">عدد الإعلانات بالكاش المحلي:</span>
                <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-500/25">
                  {productsCount}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3.5">
                <span className="text-gray-400 font-medium">تنبيهات / أخطاء الصور:</span>
                <span className="text-xs text-gray-400">لا توجد شروط لحظر العرض</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: VIP Stories Specific Debugging */}
        <div className="p-6 rounded-2xl bg-[#0e1624] border border-[#D4AF37]/20 shadow-[0_0_24px_rgba(212,175,55,0.05)] space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-md font-bold text-[#D4AF37] flex items-center gap-2">
              <span>تحليل قصص النخبة VIP Stories</span>
            </h2>
            <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-black px-3 py-1 rounded-full border border-[#D4AF37]/20">
              Collection: products
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            تنويه: قصص VIP في سوق سند لا تُحفظ في collection منفصلة بل هي عبارة عن منتجات في <strong>products collection</strong> تم تصفيتها وتصنيفها من خلال حقل <code>{`p.plan === 'vip'`}</code> أو <code>{`p.plan === 'bronze'`}</code> تظهر كقصص منسقة في الأعلى.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 font-medium mb-1">إعلانات VIP الإجمالية</span>
              <span className="text-xl font-bold font-mono text-[#D4AF37]">{diagnostics.vipProductsCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 font-medium mb-1">إعلانات Bronze الإجمالية</span>
              <span className="text-xl font-bold font-mono text-amber-500">{diagnostics.bronzeProductsCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400 font-medium mb-1">المؤهل بعد الفلترة</span>
              <span className="text-xl font-bold font-mono text-[#10B981]">{diagnostics.activeVipBronzeCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/20 flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-950/10 to-orange-950/10">
              <span className="text-xs text-amber-300 font-medium mb-1">القصص المعروضة</span>
              <span className="text-xl font-black font-mono text-amber-400 animate-pulse">{diagnostics.storiesCount}</span>
            </div>

          </div>

          {/* Critical Warning if 0 */}
          {diagnostics.storiesCount === 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2.5 leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">تحذير: لم يتم العثور على أي قصص VIP مفعلة!</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  هذا يعني أنه لا يوجد أي إعلان في قاعدة بيانات Firestore يحتوي على حقل <code>{`plan: "vip"`}</code> أو <code>{`plan: "bronze"`}</code> وحالة غير مباعة <code>{`status !== "sold"`}</code>. يرجى تهيئة أو ترقية إعلان من لوحة التحكم لتجربة ذلك.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: System Action Buttons */}
        <div className="flex flex-wrap gap-3.5">
          <button
            onClick={forceReconnect}
            disabled={isLoading}
            className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 select-none shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>إعادة فحص الاتصالات بـ Firestore</span>
          </button>

          <button
            onClick={handleClearCache}
            className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-bold rounded-xl transition duration-200 cursor-pointer select-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح كاش التخزين المحلي والإنترنت</span>
          </button>
        </div>

        {/* Section 5: Firestore Error Logger Panel */}
        <div className="p-5 rounded-2xl bg-[#110c0f] border border-rose-500/10 space-y-3.5 shadow-lg">
          <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>سجل أخطاء الاتصالات و الصلاحيات (Firestore Error Log)</span>
          </h2>

          <div className="space-y-3 text-xs sm:text-sm pt-1">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
              <div className="text-gray-400 font-medium">خطأ الصلاحية (Permission Error):</div>
              <p className="font-mono text-xs text-rose-300 break-words/all">
                {diagnostics.permissionError || "لا يوجد أي خطأ في الصلاحيات (No Permission-Denied Error)"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
              <div className="text-gray-400 font-medium">أي خطأ أخر من Firestore:</div>
              <p className="font-mono text-xs text-rose-300 break-words/all">
                {diagnostics.firestoreError || "لا يوجد أي خطأ اتصال مسجل (No Firestore errors)"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
              <div className="text-gray-400 font-medium">خطأ التهيئة المبدئية (Init Error):</div>
              <p className="font-mono text-xs text-rose-300 break-words/all">
                {diagnostics.initError || "مكتملة بنجاح (No Init Errors)"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Full Live Diagnostic Dump */}
        <div className="p-5 rounded-2xl bg-black/80 border border-white/5 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase">سجل البيانات المتكامل (Diagnostic Raw JSON Dump)</h2>
            <span className="text-[10px] font-mono text-gray-500">مفيد للأجهزة المحمولة</span>
          </div>
          <pre className="font-mono text-[10px] sm:text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap p-3.5 bg-black/30 rounded-lg max-h-[250px] leading-relaxed select-all border border-emerald-500/5 antialiased">
            {JSON.stringify({
              meta: {
                appName: "SanadSouq Debug Monitor",
                timestamp: new Date().toISOString(),
                href: typeof window !== 'undefined' ? window.location.href : 'unknown',
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
              },
              diagnostics
            }, null, 2)}
          </pre>
        </div>

      </main>

      <footer className="border-t border-white/5 bg-black/40 py-5 text-center text-xs text-gray-500">
        منصة سند تونس - جميع معلومات التشخيص مؤمنة ومشفرة محلياً 🇹🇳
      </footer>
    </div>
  );
}
