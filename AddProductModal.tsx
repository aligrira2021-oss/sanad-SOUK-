import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, MapPin, Tag, DollarSign, Loader2, Phone, Sparkles, Wand2 } from 'lucide-react';

const REGIONS = [
  'أريانة', 'باجة', 'بن عروس', 'بنزرت', 'تطاوين', 'توزر', 'تونس', 'جندوبة', 'زغوان', 'سليانة', 
  'سوسة', 'سيدي بوزيد', 'صفاقس', 'قابس', 'قبلي', 'القصرين', 'قفصة', 'القيروان', 'الكاف', 'مدنين', 
  'المنستير', 'منوبة', 'المهدية', 'نابل'
];

export default function AddProductModal({ onClose, onAdd, onEdit, currentUserPhone, currentUser, initialProduct, showToast }: { key?: React.Key, onClose: () => void, onAdd: (p: any) => void, onEdit?: (p: any) => void, currentUserPhone?: string | null, currentUser?: any, initialProduct?: any, showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void }) {
  const CATEGORIES = [
    'ملابس رجال',
    'ملابس نساء',
    'ملابس اطفال',
    'ماكياج و اكسسوارات',
    'عطورات',
    'عقارات',
    'سيارات و دراجات',
    'إلكترونيات',
    'أثاث',
    'أدوات منزلية',
    'حيوانات',
    'تحف و هدايا',
    'اخرى'
  ];

  const [images, setImages] = useState<string[]>(initialProduct?.imageUrls || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [price, setPrice] = useState(initialProduct?.price || '');
  const [phone, setPhone] = useState(initialProduct?.sellerId || currentUserPhone || '');
  const [category, setCategory] = useState(initialProduct?.category || CATEGORIES[0]);
  const [location, setLocation] = useState(initialProduct?.location || REGIONS[0]);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const handleSmartWrite = () => {
    if (!title) {
        if (showToast) {
            showToast('يرجى كتابة عنوان الإعلان أولاً لكي يستطيع الذكاء الاصطناعي توليد الوصف! ✍️', 'warning');
        } else {
            alert("يرجى كتابة عنوان الإعلان أولاً لكي يستطيع الذكاء الاصطناعي كتابة الوصف.");
        }
        return;
    }
    setIsGeneratingDesc(true);
    setTimeout(() => {
        const templates = [
            `فرصة لا تعوض! نوفر لكم اليوم "${title}" من فئة ${category} المتواجد في ${location} بسعر ممتاز جداً (${price || 'حسب الاتفاق'} د.ت). \n\nالمواصفات:\n- حالة ممتازة وجودة عالية.\n- تسليم فوري ومعاينة متاحة.\n\nلا تضيع هذه الفرصة الذهبية، تواصل معي للمزيد من التفاصيل!`,
            `لمحبي التميز، أعرض عليكم "${title}". مصنف ضمن ${category} وموجود حالياً في ${location}.\n\nمميزات العرض:\n- جودة لا تضاهى\n- سعر منافس (${price ? price + ' د.ت' : 'قابل للنقاش'})\n- جاهز للتسليم\n\nاضغط على رقم الهاتف للتواصل المباشر.`,
            `للبيع: "${title}" استثنائي في منطقة ${location}.\nمثالي للباحثين عن أفضل العروض في ${category}.\n\n- السعر: ${price ? price + ' دينار تونسي' : 'اتصل لمعرفة السعر'}\n- الحالة: ممتازة\n- التوفر: فوري\n\nتواصل معي الآن للحصول على هذه الصفقة المميزة.`
        ];
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setDescription(randomTemplate);
        setIsGeneratingDesc(false);
    }, 1500);
  };

  const isPriceInvalid = price !== '' && (isNaN(Number(price)) || Number(price) <= 0);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.includes('-')) {
      val = val.replace(/-/g, '');
    }
    setPrice(val);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const newImages: string[] = [];
      
      const processImage = (file: File): Promise<string> => {
         return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const img = new Image();
              img.src = reader.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // ====== 1. DIAGONAL REPEATING WATERMARK ======
                  ctx.save();
                  // Apply clipping mask or simple transparency
                  ctx.globalAlpha = 0.12;
                  ctx.fillStyle = '#ffffff';
                  ctx.font = `bold ${Math.max(16, Math.floor(width * 0.04))}px "Inter", "Arial", sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  // Rotate 30 degrees counter-clockwise
                  ctx.translate(width / 2, height / 2);
                  ctx.rotate(-30 * Math.PI / 180);
                  ctx.translate(-width / 2, -height / 2);
                  
                  // Draw in columns and rows
                  for (let x = -width; x < width * 2; x += 250) {
                    for (let y = -height; y < height * 2; y += 180) {
                      ctx.fillText("سوق سند ✦ SANAD SOUK", x, y);
                    }
                  }
                  ctx.restore();

                  // ====== 2. PREMIUM BOTTOM-RIGHT STAMP BADGE ======
                  ctx.save();
                  
                  // Dynamically size font in proportion to image width
                  const fontSize = Math.max(13, Math.floor(width * 0.045));
                  ctx.font = `bold ${fontSize}px "Inter", "Arial", sans-serif`;
                  
                  const watermarkText = "سوق سند ✦ SANAD SOUK";
                  const textWidth = ctx.measureText(watermarkText).width;
                  
                  // Position near bottom-right with spacing
                  const xpos = width - textWidth - 18;
                  const ypos = height - 20;
                  
                  // Draw thick high-contrast black glossy background badge
                  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                  const padX = 12;
                  const padY = 8;
                  const rx = xpos - padX;
                  const ry = ypos - fontSize - padY + 4;
                  const rw = textWidth + padX * 2;
                  const rh = fontSize + padY * 2;
                  
                  ctx.beginPath();
                  if (ctx.roundRect) {
                    ctx.roundRect(rx, ry, rw, rh, 6);
                  } else {
                    ctx.rect(rx, ry, rw, rh);
                  }
                  ctx.fill();
                  
                  // Strong solid Gold highlight border for luxury branding
                  ctx.strokeStyle = "#D4AF37";
                  ctx.lineWidth = 1.8;
                  ctx.stroke();
                  
                  // Draw primary text with solid white
                  ctx.fillStyle = "#ffffff";
                  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                  ctx.shadowBlur = 4;
                  ctx.fillText(watermarkText, xpos, ypos);
                  
                  // Glowing gold accent on app name "سوق سند"
                  const appArabic = "سوق سند";
                  ctx.fillStyle = "#D4AF37";
                  ctx.shadowBlur = 0;
                  ctx.fillText(appArabic, xpos, ypos);
                  
                  ctx.restore();
                  // ===============================================

                  resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else {
                  resolve(reader.result as string);
                }
              };
            };
            reader.readAsDataURL(file);
         });
      };

      for (const file of files) {
          const compressed = await processImage(file);
          newImages.push(compressed);
      }
      
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
      if (initialProduct) {
          setShowConfirmEdit(true);
      } else {
          executeSubmit();
      }
  };

  const executeSubmit = () => {
      const parsedPrice = Number(price);
      if (!title || !price || isNaN(parsedPrice) || parsedPrice <= 0) return;
      setIsSubmitting(true);
      setTimeout(() => {
          setIsSubmitting(false);
          const productData = {
              ...initialProduct,
              id: initialProduct?.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
              title,
              price: Number(price),
              category,
              location,
              description,
              imageUrls: images.length > 0 ? images : ['https://via.placeholder.com/400'],
              sellerId: phone || initialProduct?.sellerId || currentUserPhone || 'guest',
              sellerName: initialProduct?.sellerName || currentUser?.name || (currentUserPhone ? `User ${currentUserPhone}` : 'مستخدم'),
              sellerAvatar: initialProduct?.sellerAvatar || currentUser?.avatar || undefined,
              createdAt: initialProduct?.createdAt || new Date().toISOString(),
              status: 'active'
          };
          if (initialProduct && onEdit) {
              onEdit(productData);
          } else {
              onAdd(productData);
          }
          onClose();
      }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex items-start justify-center p-4 py-8"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="bg-[#050505] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl p-6 sm:p-8 pb-48 space-y-6 overflow-y-auto max-h-[92vh] no-scrollbar relative"
        dir="rtl"
      >
         {/* Close button in top corner inside the scroll container */}
         <div className="absolute top-4 left-4 z-10">
            <button onClick={onClose} className="p-2 hover:bg-gray-800/80 rounded-full text-gray-500 hover:text-white transition-colors cursor-pointer">
               <X className="w-5 h-5" />
            </button>
         </div>

         {/* Top Branding Header & Image Upload Group grouped tightly together and lifted up */}
         <div className="space-y-2 mt-[-22px] text-right">
            {/* Modern Header directly in scroll-flow */}
            <div className="pb-0">
               <h2 className="text-2xl font-black font-display text-white">{initialProduct ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</h2>
               <p className="text-gray-400 text-xs mt-0.5">{initialProduct ? 'قم بتعديل بيانات إعلانك.' : 'يرجى رفع صورة وإدخال تفاصيل إعلانك العقاري أو التجاري بدقة عالية.'}</p>
            </div>

            {/* Image upload area */}
            <div className="flex flex-col items-center w-full">
              <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImageChange} 
                 className="hidden" 
                 accept="image/*"
                 multiple
              />

              <div className="flex gap-3 overflow-x-auto w-full pb-2 px-2 snap-x snap-mandatory no-scrollbar" dir="rtl">
                {images.map((img, idx) => (
                  <div key={idx} className="relative shrink-0 snap-center aspect-[9/16] w-[120px] rounded-2xl overflow-hidden border border-gray-800 group">
                     <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                     <button 
                       type="button"
                       onClick={(e) => { e.stopPropagation(); removeImage(idx); }} 
                       className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur hover:bg-rose-500 p-1.5 rounded-full shadow-lg transition-colors z-10"
                     >
                        <X className="w-3.5 h-3.5 text-white" />
                     </button>
                  </div>
                ))}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-850 hover:border-[#D4AF37] rounded-3xl flex flex-col items-center justify-center bg-gray-950/40 hover:bg-gray-900/30 transition-all cursor-pointer group shrink-0 aspect-[9/16] w-[120px]"
                >
                   <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-2 group-hover:bg-[#10B981]/15 border border-gray-800 group-hover:border-[#10B981]/30 transition-all">
                      <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-[#10B981] transition-colors" />
                   </div>
                   <p className="text-white text-[11px] font-bold font-display">أضف صور</p>
                   <p className="text-[9px] text-gray-500 mt-0.5 px-2 text-center" style={{lineHeight: 1.2}}>إضافة صور<br/>لمنتجك</p>
                </div>
              </div>
            </div>
         </div>

         {/* Inputs Container */}
         <div className="space-y-4 pt-1">
            <div className="relative">
               <label className="block text-xs font-extrabold text-gray-400 mb-1.5">عنوان الإعلان</label>
               <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 px-4 outline-none transition-colors" placeholder="مثال: شقة سكنية بقرطاج..." />
            </div>
            
            <div className="relative">
               <label className="block text-xs font-extrabold text-gray-400 mb-1.5">رقم البائع</label>
               <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 px-4 outline-none transition-colors" placeholder="رقم الهاتف..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                   <label className="block text-xs font-extrabold text-gray-400 mb-1.5">السعر (د.ت)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        value={price} 
                        onChange={handlePriceChange} 
                        className={`w-full bg-[#020806] border text-sm text-white rounded-2xl py-3 pr-10 pl-4 outline-none transition-colors ${isPriceInvalid ? 'border-rose-500/80 focus:border-rose-500 text-rose-300' : 'border-gray-900 focus:border-[#D4AF37]'}`} 
                        placeholder="0" 
                        min="0.01"
                        step="any"
                      />
                      <DollarSign className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPriceInvalid ? 'text-rose-500' : 'text-gray-500'}`} />
                      {isPriceInvalid && (
                         <p className="text-rose-550 text-[11px] mt-1.5 font-sans font-bold flex items-center gap-1" dir="rtl">
                            ⚠️ يرجى إدخال سعر صحيح أكبر من 0
                         </p>
                      )}
                   </div>
                </div>
                <div className="relative">
                   <label className="block text-xs font-extrabold text-gray-400 mb-1.5">القسم</label>
                   <div className="relative">
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 pr-10 pl-4 outline-none appearance-none transition-colors">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                   </div>
                </div>
            </div>

            <div className="relative">
               <label className="block text-xs font-extrabold text-gray-400 mb-1.5">الموقع (الولاية)</label>
               <div className="relative">
                   <select value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 pr-10 pl-4 outline-none appearance-none transition-colors">
                       {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                   </select>
                   <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
               </div>
            </div>

            <div className="relative">
               <label className="block text-xs font-extrabold text-gray-400 mb-1.5">رقم الهاتف للاتصال</label>
               <div className="relative">
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 pr-10 pl-4 outline-none transition-colors" 
                    placeholder="أدخل رقم الهاتف..." 
                  />
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
               </div>
            </div>

            <div className="relative">
               <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-extrabold text-gray-400">الوصف الإعلاني</label>
                  <button 
                     type="button" 
                     onClick={handleSmartWrite}
                     disabled={isGeneratingDesc}
                     className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37] hover:text-[#fcdb71] bg-[#D4AF37]/10 px-2 py-1 rounded-lg transition-colors border border-[#D4AF37]/20"
                  >
                     {isGeneratingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                     {isGeneratingDesc ? 'جاري الكتابة...' : 'كتابة ذكية AI'}
                  </button>
               </div>
               <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#020806] border border-gray-900 focus:border-[#D4AF37] text-sm text-white rounded-2xl py-3 px-4 outline-none resize-none transition-colors" placeholder="اكتب وصفاً مفصلاً يبرز مزايا العرض والسلعة بدقة..."></textarea>
            </div>
         </div>

         {/* Action buttons embedded directly in scroll flow */}
         <div className="pt-4 flex gap-3">
            <button onClick={handleSubmit} disabled={isSubmitting || !title || !price || isPriceInvalid} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-bold rounded-2xl py-3.5 shadow-lg shadow-[#10B981]/15 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer">
               {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
               {isSubmitting ? 'جاري النشر وتدقيق البيانات...' : 'نشر الإعلان كعرض ملكي'}
            </button>
            <button onClick={onClose} disabled={isSubmitting} className="px-6 bg-[#0c0c0c] hover:bg-gray-900 text-gray-400 hover:text-white text-sm font-medium rounded-2xl py-3.5 transition-colors border border-gray-900 hover:border-gray-800 cursor-pointer">
               إلغاء
            </button>
         </div>
         {/* Confirm Dialog */}
         {showConfirmEdit && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
                 <div className="bg-[#0f0f0f] border border-gray-800 p-6 rounded-3xl w-full max-w-sm">
                     <h3 className="text-white font-bold mb-4">هل أنت متأكد من حفظ التعديلات؟</h3>
                     <div className="flex gap-4">
                         <button 
                             onClick={() => {
                                 setShowConfirmEdit(false);
                                 executeSubmit();
                             }} 
                             disabled={isSubmitting}
                             className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-2xl disabled:opacity-50"
                         >
                             {isSubmitting ? 'جاري الحفظ...' : 'حفظ ✅'}
                         </button>
                         <button onClick={() => setShowConfirmEdit(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl">إلغاء</button>
                     </div>
                 </div>
             </div>
         )}
      </motion.div>
    </motion.div>
  );
}
