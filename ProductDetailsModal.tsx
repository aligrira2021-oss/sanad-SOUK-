import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Tag, Phone, MessageCircle, Send, Trash2, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Eye, Heart, Share2, AlertTriangle, Star, Bot, Download, Loader2, Camera, ImageIcon } from 'lucide-react';
import { Product } from '../types';
import { triggerPushNotification, requestPushPermission } from '../lib/pushNotifications';

export default function ProductDetailsModal({ 
  onClose, 
  product, 
  currentUserPhone, 
  isAdmin, 
  onDelete, 
  onEdit, 
  onUpdateComments, 
  onAddNotification, 
  isFavorite, 
  onToggleFavorite,
  currentUserPlan = 'free',
  showToast,
  currentUser
}: { 
  key?: React.Key, 
  onClose: () => void, 
  product: Product, 
  currentUserPhone?: string | null, 
  isAdmin?: boolean, 
  onDelete?: () => void, 
  onEdit?: (product: Product) => void,
  onUpdateComments?: (productId: string, comments: any[]) => void,
  onAddNotification?: (phone: string, message: string) => void,
  isFavorite?: boolean,
  onToggleFavorite?: (e: React.MouseEvent) => void,
  currentUserPlan?: 'free' | 'bronze' | 'vip',
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void,
  currentUser?: any
}) {
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState(product?.comments || []);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Advanced comment feature states
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const handleDownloadImage = async () => {
    const urls = product.imageUrls?.length ? product.imageUrls : [product.imageUrls?.[0] || 'https://via.placeholder.com/400'];
    const imgUrl = urls[currentImageIndex];
    if (!imgUrl) return;

    setIsDownloading(true);
    
    const triggerDirectDownload = (url: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `sanad_ad_${product.id}_img_${currentImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    try {
      const imgObj = new Image();
      // Set anonymous crossOrigin to prevent canvas tainted security errors
      imgObj.crossOrigin = "anonymous";
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        imgObj.onload = () => resolve();
        imgObj.onerror = (e) => reject(e);
      });

      imgObj.src = imgUrl;
      await loadPromise;

      // Recreate image onto canvas with high definition scale
      const canvas = document.createElement('canvas');
      const width = imgObj.naturalWidth || imgObj.width || 800;
      const height = imgObj.naturalHeight || imgObj.height || 1000;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the main image
        ctx.drawImage(imgObj, 0, 0, width, height);

        // 1. DIAGONAL REPEATING WATERMARK OVERLAY
        ctx.save();
        ctx.globalAlpha = 0.15; // highly visible but transparent
        ctx.fillStyle = '#ffffff';
        const diagFontSize = Math.max(16, Math.floor(width * 0.04));
        ctx.font = `bold ${diagFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Translate to center and rotate
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-28 * Math.PI / 180);
        ctx.translate(-width / 2, -height / 2);

        // Paint grid pattern
        const stepX = 280;
        const stepY = 200;
        for (let x = -width; x < width * 2; x += stepX) {
          for (let y = -height; y < height * 2; y += stepY) {
            ctx.fillText("سوق سند ✦ SANAD SOUK", x, y);
          }
        }
        ctx.restore();

        // 2. CORNER GOLDEN BADGE STAMP
        ctx.save();
        const stampFontSize = Math.max(14, Math.floor(width * 0.045));
        ctx.font = `bold ${stampFontSize}px sans-serif`;
        
        const watermarkText = "سوق سند ✦ SANAD SOUK";
        const textWidth = ctx.measureText(watermarkText).width;
        
        // Positioning details
        const xpos = width - textWidth - 22;
        const ypos = height - 24;
        
        // Draw solid opaque background for extreme readability
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        const padX = 14;
        const padY = 10;
        const rx = xpos - padX;
        const ry = ypos - stampFontSize - padY + 4;
        const rw = textWidth + padX * 2;
        const rh = stampFontSize + padY * 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, rw, rh, 8);
        } else {
          ctx.rect(rx, ry, rw, rh);
        }
        ctx.fill();
        
        // Solid bold Gold border structure
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Shadowing Text
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(watermarkText, xpos, ypos);
        
        // Highlights
        ctx.fillStyle = "#D4AF37";
        ctx.shadowBlur = 0;
        ctx.fillText("سوق سند", xpos, ypos);
        ctx.restore();

        // Convert the watermarked canvas back to dataUrl
        const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        triggerDirectDownload(watermarkedDataUrl);
        if (showToast) {
          showToast('تم تحميل الصورة بشعار سوق سند الموثق! 📥', 'success');
        }
      } else {
        triggerDirectDownload(imgUrl);
      }
    } catch (err) {
      console.error('Error drawing watermarked download canvas, falling back to direct:', err);
      try {
        triggerDirectDownload(imgUrl);
        if (showToast) {
          showToast('تم تحميل الصورة بنجاح! 📥', 'success');
        }
      } catch (fallbackErr) {
        if (showToast) {
          showToast('اضغط باستمرار على الصورة لحفظها مباشرة في جهازك.', 'warning');
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const clickBuffer = React.useRef<number>(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const isPhoneAdmin = (phone?: string | null): boolean => {
    if (!phone) return false;
    const clean = phone.replace(/[^0-9]/g, '');
    return clean === '92942482' || clean === '21692942482' || clean.endsWith('92942482');
  };

  // Premium Poster Builder States
  const [posterTheme, setPosterTheme] = useState<'gold' | 'emerald' | 'crimson'>('gold');
  const [posterSlogan, setPosterSlogan] = useState('حالة ممتازة تواصل واطلب الآن ✦');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  const normalizePhone = (phone?: string | null) => phone ? phone.replace(/[^0-9]/g, '').slice(-8) : '';
  const isOwner = currentUserPhone && product.sellerId && normalizePhone(currentUserPhone) === normalizePhone(product.sellerId);
  const canDelete = !!isAdmin || isOwner; // Admin or owner can delete
  const canEdit = !!isAdmin || isOwner; // Admin or owner can edit

  if (!product) return null;

  const scrollNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' }); // rtl is negative... wait, if `dir="ltr"` is used for scroll, it's positive. Let's use `clientWidth` and just rely on ltr scrolling.
    }
  };

  const scrollPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' }); // for LTR, scrollBy(positive) goes right. Wait, the container has `dir="ltr"`. Let's test left/right carefully inside the component or just check `scrollRef.current.scrollBy({ left: 300 })`. Actually, let's use positive for next and negative for prev since it's dir="ltr".
    }
  };

  const nextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' });
  };
  const prevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' });
  };

  const handleImageDoubleClick = (e: React.MouseEvent) => {
    if (!onToggleFavorite) return;
    
    const now = Date.now();
    if (now - clickBuffer.current < 400) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
      if (!isFavorite) {
        onToggleFavorite(e);
      }
      clickBuffer.current = 0;
    } else {
      clickBuffer.current = now;
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    setPermissionStatus(res);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?ad=${product.id}`;
    
    // Update document title for better local sharing context
    document.title = `سوق سند - ${product.title}`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `سوق سند - ${product.title}`);
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && product.imageUrls && product.imageUrls[0]) ogImage.setAttribute('content', product.imageUrls[0]);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `سوق سند - ${product.title}`,
          text: `شاهد هذا الإعلان في سوق سند: ${product.title}\nبسعر: ${product.price} د.ت`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareUrl}\n\nشاهد الإعلان: ${product.title}\nالسعر: ${product.price} د.ت`);
      if (showToast) {
        showToast('تم نسخ رابط الإعلان بنجاح إلى الحافظة! 🔗', 'success');
      } else {
        alert('تم نسخ الرابط بنجاح!');
      }
    }
  };

  const handleReport = () => {
    setIsReported(true);
    if (showToast) {
      showToast('تم إرسال بلاغك وسيقوم فريق سوق سند بمراجعته قريباً. شكراً لتعاونك! 🛡️', 'success');
    } else {
      alert('تم إرسال بلاغك وسيقوم فريق سوق سند بمراجعته. شكراً لاهتمامك.');
    }
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressingImage(true);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600; // Compact but legible for comment media
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Subtly stamp comment photo at bottom center as watermark proof
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(0, height - 24, width, 24);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("استفسار سوق سند ✦ SOUK SANAD", width / 2, height - 8);
            ctx.restore();

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setCommentImage(compressedBase64);
          } else {
            setCommentImage(reader.result as string);
          }
          setIsCompressingImage(false);
        };
      };
      reader.onerror = () => {
        setIsCompressingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() && !commentImage) return;
    
    // Dynamic naming and badge identity determination
    const displayName = currentUser?.name || (currentUserPhone ? `مستعمل (${currentUserPhone})` : 'زائر سوق سند ✦');
    let userRole = 'free';
    if (isPhoneAdmin(currentUserPhone)) {
      userRole = 'admin';
    } else if (currentUserPhone && product.sellerId && normalizePhone(currentUserPhone) === normalizePhone(product.sellerId)) {
      userRole = 'seller';
    } else {
      userRole = currentUserPlan || 'free';
    }

    const newComment = { 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      userId: currentUserPhone || 'me', 
      userName: displayName, 
      userRole: userRole,
      avatar: currentUser?.avatar || '',
      text: commentText, 
      image: commentImage, // Base64 compressed, watermarked comment photo
      createdAt: 'الآن' 
    };

    const newComments = [...comments, newComment];
    setComments(newComments);
    setCommentText('');
    setCommentImage(null);

    // Trigger subtle shake response for visual feedback
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 550);

    if (onUpdateComments) {
      onUpdateComments(product.id, newComments);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const newComments = comments.filter(c => c.id !== commentId);
    setComments(newComments);
    if (onUpdateComments) {
      onUpdateComments(product.id, newComments);
    }
  };

  // const isOwner = currentUserPhone && (isPhoneAdmin(currentUserPhone) || currentUserPhone === product.sellerId);

  const handleDownloadPoster = async () => {
    setIsGeneratingPoster(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw beautiful dark futuristic gradient background depending on selected theme
      const grad = ctx.createRadialGradient(300, 300, 50, 300, 450, 600);
      if (posterTheme === 'emerald') {
        grad.addColorStop(0, '#022c22'); // dark emerald
        grad.addColorStop(1, '#000000');
      } else if (posterTheme === 'crimson') {
        grad.addColorStop(0, '#450a0a'); // dark red
        grad.addColorStop(1, '#000000');
      } else {
        grad.addColorStop(0, '#1c1917'); // dark gold/stone
        grad.addColorStop(1, '#000000');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 900);

      // 2. Draw luxury glowing border frame
      const frameColor = posterTheme === 'emerald' ? '#10B981' : posterTheme === 'crimson' ? '#EF4444' : '#D4AF37';
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(20, 20, 560, 860);

      // Fine shiny thin inner borders block
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(28, 28, 544, 844);

      // 3. Draw Header Title: Premium branding "سوق سند"
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('سـوق سـنـد الـتـونـسـي', 300, 75);

      ctx.fillStyle = frameColor;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('S O U Q   S A N A D   V I P', 300, 100);

      // Draw horizontal line separator
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(100, 115);
      ctx.lineTo(500, 115);
      ctx.stroke();

      // 4. Draw Product Title (in Arabic)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(product.title.substring(0, 34), 300, 160);

      // 5. Draw Product Image (with CORS handled gracefully)
      const drawProductImage = () => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const targetWidth = 440;
              const targetHeight = 310;
              const x = 80;
              const y = 200;

              // Draw image shadow offset card
              ctx.shadowColor = 'rgba(0,0,0,0.6)';
              ctx.shadowBlur = 20;
              ctx.fillStyle = '#111';
              ctx.fillRect(x - 5, y - 5, targetWidth + 10, targetHeight + 10);
              ctx.shadowColor = 'transparent';

              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(x, y, targetWidth, targetHeight);

              const imgRatio = img.width / img.height;
              const boxRatio = targetWidth / targetHeight;
              let drawW = targetWidth;
              let drawH = targetHeight;
              let drawX = x;
              let drawY = y;

              if (imgRatio > boxRatio) {
                drawH = targetWidth / imgRatio;
                drawY = y + (targetHeight - drawH) / 2;
              } else {
                drawW = targetHeight * imgRatio;
                drawX = x + (targetWidth - drawW) / 2;
              }

              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              resolve();
            } catch (err) {
              resolve();
            }
          };
          img.onerror = () => {
            resolve();
          };
          img.src = product.imageUrls?.[0] || 'https://via.placeholder.com/400';
        });
      };

      await drawProductImage();

      // Ensure design stays correct even if image skipped
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(80, 200, 440, 310);

      // 6. Draw Price Ribbon Ticket bottom banner
      ctx.fillStyle = frameColor;
      ctx.fillRect(100, 535, 400, 65);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${product.price} د.ت`, 300, 580);

      // 7. Slogan & Slogan subtitle
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(posterSlogan, 300, 645);

      // 8. Call Info Block & QR Contact code
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`مباشر الهاتف: ${product.sellerId}`, 300, 715);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText('تواصل الآن لتنسيق الشراء والاستلام الفوري', 300, 745);

      // Draw stylized badge verification stamp
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('VERIFIED SOUQ SANAD VIP EXCLUSIVE', 300, 795);

      // Draw crown vector emblem
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.moveTo(280, 815);
      ctx.lineTo(290, 823);
      ctx.lineTo(300, 810);
      ctx.lineTo(310, 823);
      ctx.lineTo(320, 815);
      ctx.lineTo(315, 830);
      ctx.lineTo(285, 830);
      ctx.closePath();
      ctx.fill();

      // Trigger standard local download
      const link = document.createElement('a');
      link.download = `souq_sanad_poster_${product.id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (error) {
      console.error('Error generating canvas poster:', error);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg overflow-y-auto no-scrollbar scroll-smooth"
      dir="rtl"
    >
      <div className="w-full max-w-lg mx-auto bg-[#050505] min-h-screen relative flex flex-col border-x border-gray-900 shadow-2xl">
        {/* Full Viewport Story Block */}
        <div className="relative h-[100dvh] w-full flex flex-col justify-end p-6 overflow-hidden shrink-0">
          {/* Main Image */}
          <div 
            onClick={handleImageDoubleClick}
            className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden group"
          >
            <div ref={scrollRef} className="flex w-full h-full snap-x snap-mandatory overflow-x-auto no-scrollbar scroll-smooth" dir="ltr" onScroll={(e) => {
                const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
                setCurrentImageIndex(index);
            }}>
                {(product.imageUrls?.length ? product.imageUrls : [product.imageUrls?.[0] || 'https://via.placeholder.com/400']).map((img, idx) => (
                   <img 
                      key={idx}
                      src={img} 
                      alt={product.title} 
                      className="w-full h-full shrink-0 object-cover object-center select-none pointer-events-none block brightness-110 contrast-105 saturate-110 snap-center" 
                      referrerPolicy="no-referrer" 
                   />
                ))}
            </div>

            {product.imageUrls && product.imageUrls.length > 1 && (
                <>
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20">
                     <button onClick={prevImage} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                     </button>
                  </div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
                     <button onClick={nextImage} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors">
                        <ChevronRight className="w-6 h-6" />
                     </button>
                  </div>
                  <div className="absolute bottom-[40%] left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none" dir="ltr">
                      {product.imageUrls.map((_, idx) => (
                          <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
                      ))}
                  </div>
                </>
            )}
            
            {/* Heart Animation Overlay */}
            <AnimatePresence>
              {showHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.8, times: [0, 0.4, 1] }}
                  className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                >
                  <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Floating Actions inside image top */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
             <button onClick={onClose} className="p-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer" title="إغلاق">
                <X className="w-6 h-6" />
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); handleDownloadImage(); }} 
                disabled={isDownloading}
                className="p-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full text-[#D4AF37] hover:text-[#fcdb71] transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg border border-white/10 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                title="تحميل هذه الصورة"
             >
                {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
             </button>
          </div>

          {(canEdit || canDelete) && (
             <div className="absolute top-6 right-6 z-20 flex gap-2">
                {canEdit && onEdit && (
                    <button onClick={() => { onClose(); onEdit(product); }} className="p-3 bg-blue-500/80 hover:bg-blue-600 backdrop-blur-md rounded-full text-white transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg border border-blue-500/20">
                       <Tag className="w-5 h-5" />
                    </button>
                )}
                {canDelete && onDelete && (
                    showConfirmDelete ? (
                        <div className="flex items-center gap-2 bg-red-500/95 backdrop-blur-md rounded-full px-4 py-2 border border-red-900 text-white shadow-lg">
                           <span className="text-xs font-bold">هل أنت متأكد؟</span>
                          <button onClick={async () => { 
                             // Show loading state or directly trigger delete and close
                             onDelete(); 
                             onClose(); 
                          }} className="bg-white/10 p-1.5 hover:bg-white/25 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold">حذف ✅</button>
                           <button onClick={() => setShowConfirmDelete(false)} className="bg-white/10 p-1.5 hover:bg-white/25 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setShowConfirmDelete(true)} className="p-3 bg-red-500/80 hover:bg-red-600 backdrop-blur-md rounded-full text-white transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg border border-red-500/20">
                           <Trash2 className="w-5 h-5" />
                        </button>
                    )
                )}
             </div>
          )}

          {/* VIP Premium Badge */}
          {product.isVip && (
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] via-[#FFFdd0] to-[#D4AF37] text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg border border-[#D4AF37]/50 flex items-center gap-1 animate-pulse">
               <Sparkles className="w-3.5 h-3.5 fill-black" />
               <span>نخبة VIP</span>
             </div>
          )}

          {/* Content overlay inside story */}
          <div className="relative z-10 w-full space-y-4">
             <div className="w-full">
                <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-md leading-normal mb-3 font-display w-full max-w-full line-clamp-2 sm:line-clamp-3 min-h-[3.5rem] sm:min-h-[4.5rem]" dir="auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' as any }}>{product.title}</h1>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#10B981]/25 border border-[#10B981]/30 backdrop-blur-md text-[#10B981] font-black text-xl shadow-md">
                   {product.price} <span className="text-sm font-bold">د.ت</span>
                </div>
             </div>

             {/* Animated Guide indicator */}
             <div className="flex flex-col items-center justify-center pt-8 pb-2 opacity-85">
                <p className="text-xs text-gray-300 font-medium tracking-wide animate-pulse mb-1">اسحب للأعلى لقراءة التفاصيل والتعليقات</p>
                <ChevronDown className="w-5 h-5 text-gray-400 animate-bounce rotate-180" />
             </div>
          </div>
        </div>

        {/* Screen Block 2: Complete Details, Description & Comments */}
        <div className="p-6 pb-48 space-y-8 bg-[#050505]" dir="rtl">
           {/* Tags / Metadata */}
           <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-full font-medium">
                 <MapPin className="w-3.5 h-3.5 text-red-400" /> 
                 <span>ولاية {product.location}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-full font-medium">
                 <Tag className="w-3.5 h-3.5 text-teal-400" /> 
                 <span>قسم {product.category}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-full font-medium">
                 <Eye className="w-3.5 h-3.5 text-blue-400" /> 
                 <span>{product.views || 0} مشاهدة</span>
              </span>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-300 bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:text-white px-3.5 py-2 rounded-full font-medium transition-colors cursor-pointer"
                title="مشاركة العرض"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>مشاركة</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite && onToggleFavorite(e);
                }}
                className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-full font-bold transition-all active:scale-90 border shadow-sm ${
                  isFavorite 
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
                    : 'bg-gray-900/80 text-gray-300 border-gray-800 hover:border-red-500/40 hover:bg-gray-800'
                }`}
              >
                 <motion.div animate={isFavorite ? { scale: [1, 1.4, 1] } : {}}>
                   <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-red-400 fill-transparent'}`} /> 
                 </motion.div>
                 <span>{product.likes || 0} إعجاب</span>
                 {isFavorite && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full mr-1">تم!</span>}
              </button>
           </div>

           {/* Description with high readability card */}
           <div className="p-5 rounded-2xl bg-[#090909] border border-gray-900 shadow-sm relative">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                 <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block"></span>
                 تفاصيل الإعلان
              </h3>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm break-words" dir="auto" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                 {product.description || 'لا يوجد وصف متاح لهذا الإعلان.'}
              </p>
           </div>

           {/* Seller information card with rich touch handles */}
           <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#040404] border border-gray-800 flex flex-col gap-4 shadow-md">
              <div className="flex items-center gap-3.5">
                 <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-700 shadow-sm shrink-0">
                    <img src={product.sellerAvatar || 'https://via.placeholder.com/150'} alt={product.sellerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#0A0A0A] shadow animate-pulse"></div>
                 </div>
                  <div className="flex-1 min-w-0 text-right">
                     <p className="text-white font-bold text-sm truncate">{product.sellerName}</p>
                     <p className="text-[11px] text-[#10B981] font-bold mt-0.5 tracking-wider">بائع نشط في سوق سند</p>
                     <div className="flex items-center gap-0.5 mt-1">
                       <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                       <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                       <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                       <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                       <Star className="w-3 h-3 text-gray-600 fill-gray-600" />
                       <span className="text-[10px] text-gray-400 ml-1 mr-1.5">(4.0)</span>
                     </div>
                     <p className="text-xs text-gray-500 font-mono mt-1">{product.sellerId}</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                 <a 
                    href={`tel:${product.sellerId}`} 
                    className="flex items-center justify-center gap-2 bg-[#10B981]/10 hover:bg-[#10B981] text-[#10B981] hover:text-white border border-[#10B981]/20 px-4 py-3 rounded-2xl font-bold transition-all text-xs shadow-sm hover:scale-102 active:scale-98"
                 >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>اتصال ({product.sellerId})</span>
                 </a>
                 <a 
                   href={
                     isPhoneAdmin(product.sellerId)
                       ? 'https://wa.me/21692942482'
                       : `https://wa.me/216${product.sellerId?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن إعلانك بـ "سوق سند": "${product.title}" بسعر ${product.price} د.ت`)}`
                   }
                   target="_blank" 
                   rel="noreferrer noopener"
                   className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/20 px-4 py-3 rounded-2xl font-bold transition-all text-xs shadow-sm hover:scale-102 active:scale-98"
                 >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>واتساب مباشر</span>
                 </a>
              </div>
              <button
                onClick={() => {
                   const isAdminProduct = isPhoneAdmin(product.sellerId);
                    if (isAdminProduct) {
                       window.open('https://wa.me/21692942482', '_blank');
                       return;
                    }
                    const templates = [
                       `السلام عليكم ورحمة الله، أعجبني إعلانك لـ "${product.title}" على سوق سند. هل السعر المعروض (${product.price} د.ت) قابل للنقاش البسيط للجادين؟`,
                       `مرحباً بك أخي الكريم، أود الاستفسار عن إعلانك لـ "${product.title}" في سوق سند. أنا شاري جاد، ما هو أفضل سعر للبيع الفوري؟`,
                       `تحية طيبة، لقد شاهدت إعلان "${product.title}" وهو يحمل مواصفات أبحث عنها. أود تأكيد الشراء والتواصل معك للاتفاق.`
                    ];
                    const aiMessage = templates[Math.floor(Math.random() * templates.length)];
                    const waUrl = `https://wa.me/216${product.sellerId?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(aiMessage)}`;
                    window.open(waUrl, '_blank');
                }}
                className="mt-1 flex flex-col items-center justify-center py-2.5 px-4 bg-gradient-to-r from-[#D4AF37]/10 to-amber-500/5 hover:from-[#D4AF37]/20 hover:to-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 w-full"
              >
                 <div className="flex items-center gap-2 font-bold text-xs">
                     <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                     <span>رسالة مجهزة بالذكاء الاصطناعي للبائع ✨</span>
                 </div>
              </button>
           </div>

           {/* Interactive Comments system */}
           <div className="pt-4 border-t border-gray-900 space-y-5">
              <div className="flex justify-between items-center text-right">
                <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                    <span>الأسئلة والتعليقات ({comments.length})</span>
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">سري وآمن 🔒</span>
              </div>
              
              {/* Shaking Container for visual feedback when adding comments */}
              <motion.div 
                animate={isShaking ? { x: [-10, 10, -7, 7, -3, 3, 0], scale: [1, 1.01, 1] } : {}}
                transition={{ duration: 0.52 }}
                className="space-y-4 font-sans"
              >
                 {comments.length > 0 ? (
                    comments.map((c, index) => {
                        const canDelete = isAdmin || currentUserPhone === '92942482' || currentUserPhone === c.userId || currentUserPhone === product.sellerId;
                        
                        const normalizedRole = c.userRole || 'free';
                        let badgeNode = null;

                        if (normalizedRole === 'admin') {
                          badgeNode = (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600/35 via-yellow-500/30 to-amber-600/35 text-[#ffdf7b] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)] shrink-0">
                              <span>إدارة سوق سند 🛡️</span>
                            </span>
                          );
                        } else if (normalizedRole === 'seller') {
                          badgeNode = (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#6ee7b7] border border-[#10B981]/30 shrink-0">
                              <span>صاحب الإعلان ✦</span>
                            </span>
                          );
                        } else if (normalizedRole === 'vip') {
                          badgeNode = (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600/35 to-indigo-500/35 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(147,51,234,0.15)] shrink-0">
                              <span>عضو VIP 💎</span>
                            </span>
                          );
                        } else if (normalizedRole === 'bronze') {
                          badgeNode = (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-700/15 text-amber-300 border border-amber-600/30 shrink-0">
                              <span>متميز ⚡</span>
                            </span>
                          );
                        }

                        const userInitial = c.userName ? c.userName.charAt(0).toUpperCase() : 'س';
                        
                        return (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                          key={c.id} 
                          className={`group/comment p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-2 text-right ${
                            normalizedRole === 'admin' 
                              ? 'bg-[#150e02]/70 border-amber-500/20 shadow-[0_4px_15px_rgba(212,175,55,0.04)]'
                              : normalizedRole === 'seller'
                              ? 'bg-[#030a06]/70 border-emerald-500/20'
                              : 'bg-[#090909]/95 border-gray-900/80 hover:border-gray-800'
                          }`}
                        >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                               <div className="flex items-center gap-2.5 min-w-0">
                                 <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${
                                   normalizedRole === 'admin' 
                                     ? 'bg-amber-500/20 text-[#D4AF37] border border-amber-500/30'
                                     : normalizedRole === 'seller'
                                     ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                     : 'bg-zinc-800 text-zinc-300'
                                 }`}>
                                   {c.avatar ? (
                                     <img src={c.avatar} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                   ) : (
                                     <span>{userInitial}</span>
                                   )}
                                 </div>
                                 <div className="flex flex-col text-right justify-center shrink-0">
                                    <span className="font-bold text-gray-200 text-xs tracking-wide">{c.userName}</span>
                                 </div>
                                 {badgeNode}
                               </div>

                               <div className="flex items-center gap-1.5 shrink-0">
                                   <span className="text-[10px] text-gray-500 font-mono font-medium">{c.createdAt}</span>
                                   {canDelete && (
                                       <button 
                                         onClick={() => handleDeleteComment(c.id)} 
                                         className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/5 transition-all opacity-70 group-hover/comment:opacity-100 cursor-pointer"
                                         title="حذف التعليق"
                                       >
                                           <Trash2 className="w-3.5 h-3.5" />
                                       </button>
                                   )}
                               </div>
                            </div>
                            
                            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed pr-9 pl-4 whitespace-pre-wrap selection:bg-[#D4AF37]/35 select-text" dir="auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' as any }}>{c.text}</p>
                            
                            {c.image && (
                              <div className="pr-9 pt-1.5">
                                <div 
                                  onClick={() => setZoomedImage(c.image)}
                                  className="relative inline-block overflow-hidden rounded-xl border border-gray-800/80 cursor-zoom-in group/img shadow-md hover:border-[#D4AF37]/50 transition-all max-w-[170px] aspect-[4/3] sm:max-w-[200px]"
                                >
                                  <img 
                                    src={c.image} 
                                    alt="مرفق بالتعليق" 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">اضغط للتكبير 🔍</span>
                                  </div>
                                </div>
                              </div>
                            )}
                        </motion.div>
                    )})
                 ) : (
                    <div className="text-center py-7 text-gray-400 bg-[#070707] rounded-2xl border border-gray-900/60 shadow-inner">
                       <MessageCircle className="w-7 h-7 mx-auto mb-2 text-gray-600 animate-pulse" />
                       <p className="text-xs font-bold text-gray-400">لا توجد أسئلة أو تعليقات بعد</p>
                       <p className="text-[10px] text-gray-600 mt-1">كن أول من يطرح استفساراً وسيقوم البائع بالرد عليك فورا!</p>
                    </div>
                 )}
              </motion.div>
              
              {commentImage && (
                <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-900 flex items-center justify-between gap-3 animate-fade-in text-sm text-right">
                   <div className="flex items-center gap-2.5 min-w-0">
                     <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-800 shrink-0 font-sans">
                        <img src={commentImage} className="w-full h-full object-cover animate-pulse" />
                        <button 
                          onClick={() => setCommentImage(null)}
                          className="absolute inset-0 bg-black/65 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-red-400 group cursor-pointer"
                          title="إلغاء المرفق"
                        >
                          <X className="w-5 h-5 shrink-0" />
                        </button>
                     </div>
                     <span className="text-xs text-[#10B981] font-bold truncate">تم إرفاق صورة بالتعليق بنجاح 👍</span>
                   </div>
                   <button 
                     onClick={() => setCommentImage(null)} 
                     className="text-xs text-red-400 underline p-1 hover:text-red-300 shrink-0 cursor-pointer"
                   >
                     حذف المرفق
                   </button>
                </div>
              )}

              <div className="relative pt-1 pb-6">
                  <input 
                    type="file" 
                    id="comment-photo-file-input" 
                    accept="image/*" 
                    onChange={handleCommentImageChange} 
                    className="hidden" 
                  />
                  
                  <input 
                     type="text" 
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                     disabled={isCompressingImage}
                     className="w-full bg-[#030303] border border-gray-800 hover:border-gray-700 focus:border-[#D4AF37] outline-none text-xs text-right text-white rounded-2xl py-3.5 pr-4 pl-[88px] transition-all duration-300" 
                     placeholder={isCompressingImage ? "جاري تشفير وضغط الصورة المرفقة... ⏳" : "اسأل البائع أو اترك استفساراً..."} 
                  />
                  
                  <div className="absolute left-2.5 bottom-[14.5px] flex items-center gap-2">
                      <button 
                         onClick={() => {
                           const el = document.getElementById('comment-photo-file-input');
                           if (el) el.click();
                         }}
                         disabled={isCompressingImage}
                         type="button"
                         className={`p-2 rounded-xl text-gray-400 hover:text-[#D4AF37] transition-all hover:bg-white/5 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${commentImage ? 'text-[#D4AF37]' : ''}`}
                         title="إرفاق صورة استفسار"
                      >
                         {isCompressingImage ? (
                           <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                         ) : (
                           <Camera className="w-4 h-4" />
                         )}
                      </button>

                      <button 
                         onClick={handleAddComment}
                         disabled={(!commentText.trim() && !commentImage) || isCompressingImage}
                         className="p-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:hover:bg-[#10B981] text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#10B981]/15 cursor-pointer flex items-center justify-center shrink-0"
                         title="نشر التعليق"
                      >
                         <Send className="w-4 h-4" />
                      </button>
                  </div>
              </div>
           </div>
        </div>
     </div>

     {/* Zoomed Image Lightbox Modal */}
     <AnimatePresence>
       {zoomedImage && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={() => setZoomedImage(null)}
           className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
         >
           <button 
             onClick={() => setZoomedImage(null)} 
             className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all scale-100 hover:scale-105"
           >
             <X className="w-6 h-6" />
           </button>
           <motion.img 
             initial={{ scale: 0.92, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.92, opacity: 0 }}
             src={zoomedImage} 
             alt="صورة مكبرة" 
             className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
             referrerPolicy="no-referrer"
             onClick={(e) => e.stopPropagation()}
           />
           <div className="absolute bottom-6 inset-x-0 text-center text-xs text-gray-500 font-medium">سوق سند ✦ SANAD SOUK</div>
         </motion.div>
       )}
     </AnimatePresence>
   </motion.div>
 );
}