/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, User, Filter, Globe, PlusCircle, Crown, Star, ShoppingBag, ShieldCheck, MessageCircle, Bot, Sparkles, Grid, List, Shirt, Baby, Car, Smartphone, Home, Coffee, PawPrint, Package, BrainCircuit, X, Trash2, ChevronDown, Droplets, Mic, Tag, Facebook, Loader2, LogIn, Bell } from 'lucide-react';
import { Product, Story } from './types';
import { safeStorage } from './lib/safeStorage';
import { cleanUndefined } from './lib/utils';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { db, messaging } from './firebase';
import { initialProducts } from './initialData';
// Removed CursorGlow import
import VipStoriesRow from './components/VipStoriesRow';
import BroadcastMarquee, { BroadcastMessage } from './components/BroadcastMarquee';
import ListingCard from './components/ListingCard';


// Lazy imports for heavy components to improve TTI
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const ProfileModal = React.lazy(() => import('./components/ProfileModal'));
const AddProductModal = React.lazy(() => import('./components/AddProductModal'));
const ProductDetailsModal = React.lazy(() => import('./components/ProductDetailsModal'));
const PricingPackages = React.lazy(() => import('./components/PricingPackages'));
const StoryViewerModal = React.lazy(() => import('./components/StoryViewerModal'));

import AuthModal from './components/AuthModal';
import WelcomeSplashModal from './components/WelcomeSplashModal';
import PublishingTransition from './components/PublishingTransition';
import Sidebar from './components/Sidebar';
import PaymentModal from './components/PaymentModal';
import SplashScreen from './components/SplashScreen';
import ListingSkeleton from './components/ListingSkeleton';
import EmptyState from './components/EmptyState';
import Toast from './components/Toast';
import confetti from 'canvas-confetti';

import Footer from './components/Footer';
import { playLoginSound, playListingSound, playSubscriptionClapSound } from './lib/audioEffects';
import DebugView from './components/DebugView';

// Fallback loader for Suspense
const ModalFallback = () => (
   <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 border border-gray-800 shadow-2xl">
         <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
         <p className="text-gray-400 text-sm font-display">جاري التحميل...</p>
      </div>
   </div>
);

// No more dummy stories or products
// Using real data from Firestore


const CATEGORIES = [
  'الكل',
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
const REGIONS = [
  'الكل', 'أريانة', 'باجة', 'بن عروس', 'بنزرت', 'تطاوين', 'توزر', 'تونس', 'جندوبة', 'زغوان', 'سليانة', 
  'سوسة', 'سيدي بوزيد', 'صفاقس', 'قابس', 'قبلي', 'القصرين', 'قفصة', 'القيروان', 'الكاف', 'مدنين', 
  'المنستير', 'منوبة', 'المهدية', 'نابل'
];

export default function App() {
  const [showDebugPage, setShowDebugPage] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        return window.location.pathname === '/debug' || 
               window.location.pathname === 'debug' || 
               new URLSearchParams(window.location.search).get('page') === 'debug';
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof window !== 'undefined' && navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (err) {
      console.warn('Haptic feedback is not supported or blocked:', err);
    }
  };

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = safeStorage.getItem('sanad_cached_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [productsLoaded, setProductsLoaded] = useState(() => {
    try {
      const saved = safeStorage.getItem('sanad_cached_products');
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  });
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [systemRequests, setSystemRequests] = useState<any[]>(() => {
    try {
      const saved = safeStorage.getItem('sanad_system_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  useEffect(() => {
    // 1. Instantly fetch using HTTP (getDocs) so WebView shows data immediately even if WebSocket blocks.
    const fetchInitialData = async () => {
      console.log('SanadSouq: Starting to fetch products from Firestore on mount...');
      try {
        const prodSnapshot = await getDocs(collection(db, 'products'));
        console.log(`SanadSouq: Fetched ${prodSnapshot.size} products from Firestore in getDocs`);
        if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
          (window as any).__sanadDiagnostics.productsFetchedCount = prodSnapshot.size;
          (window as any).__sanadDiagnostics.networkFetchedSuccess = true;
          (window as any).__sanadDiagnostics.connectionStatus = `Fetched initial products successfully: ${prodSnapshot.size}`;
          (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
        }
        let prods: Product[] = [];
        prodSnapshot.forEach(doc => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });
        
        if (prods.length === 0) {
           console.log("SanadSouq API Warning: products collection is exactly 0 length! Is the database empty or is it reading the wrong database/projectId?");
        }

        const sorted = prods.sort((a, b) => {
            const tA = new Date(a.createdAt).getTime();
            const tB = new Date(b.createdAt).getTime();
            return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        });
        console.log(`SanadSouq: Successfully sorted ${sorted.length} products`);
        
        // Always set products to the latest sorted retrieved list to guarantee zero delay and bypass any stale cache
        setProducts(sorted);
        setProductsLoaded(true);
        safeStorage.setItem('sanad_cached_products', JSON.stringify(sorted));

        const searchParams = new URLSearchParams(window.location.search);
        const initialAdId = searchParams.get('ad');
        if (initialAdId) {
           const ad = sorted.find(p => p.id === initialAdId);
           if (ad) {
             setSelectedProduct(ad);
           }
        }
      } catch (err: any) {
        console.error("SanadSouq: Fast fetch failed with error:", err?.message || err);
        console.error("SanadSouq Error details:", JSON.stringify(err));
        if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
          (window as any).__sanadDiagnostics.firestoreError = err?.message || String(err);
          (window as any).__sanadDiagnostics.connectionStatus = `Fast fetch failed: ${err?.message || err}`;
          if (err?.code === 'permission-denied') {
            (window as any).__sanadDiagnostics.permissionError = err?.message || String(err);
          }
          (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
        }
      }
    };
    fetchInitialData();

    // 2. Attach real-time listener
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      console.log('SanadSouq: Real-time listener received snapshot of products: size', snapshot.size);
      if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
        (window as any).__sanadDiagnostics.productsSnapshotCount = snapshot.size;
        (window as any).__sanadDiagnostics.realtimeSyncSuccess = true;
        (window as any).__sanadDiagnostics.connectionStatus = `Syncing real-time products. Snapshot count: ${snapshot.size}`;
        (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
      }
      let prods: Product[] = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          prods.push({ id: doc.id, ...data } as Product);
        });
      }
      const sorted = prods.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime();
          const tB = new Date(b.createdAt).getTime();
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
      // Check for newly added products to trigger favorite category notifications
      if (productsRef.current.length > 0) {
        const previousIds = new Set(productsRef.current.map(p => p.id));
        const newProducts = sorted.filter(p => !previousIds.has(p.id));
        
        newProducts.forEach(item => {
          const createdTime = new Date(item.createdAt).getTime();
          // Added within recent time after app opened and not uploaded by this user themselves
          if (createdTime > appOpenTimeRef.current - 120000 && item.sellerId !== safeStorage.getItem('sanad_current_user_phone')) {
            const isFavorite = favoriteCategoriesRef.current.includes(item.category);
            if (isFavorite) {
              // 1. Core Native Browser Notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('🔔 إعلان جديد في أقسامك المفضلة!', {
                  body: `تم إضافة "${item.title}" في قسم: ${item.category} بسعر ${item.price} د.ت`,
                  icon: '/apple-touch-icon.png'
                });
              }

              // 2. Add to local userNotifications array
              const customNotifId = 'fcm-' + item.id + '-' + Date.now();
              const pushNotif = {
                id: customNotifId,
                userPhone: safeStorage.getItem('sanad_current_user_phone') || 'visitor',
                message: `🎯 إشعار الأقسام المفضلة: تم إضافة إعلان جديد في قسم "${item.category}"! المنتج: "${item.title}" بسعر ${item.price} د.ت. اضغط هنا للمعاينة الفورية!`,
                read: false,
                createdAt: new Date().toISOString(),
                productId: item.id
              };

              setUserNotifications(prev => {
                if (prev.some(n => n.productId === item.id && n.message.includes('🎯'))) return prev;
                const updated = [pushNotif, ...prev];
                safeStorage.setItem('sanad_user_notifications', JSON.stringify(updated));
                return updated;
              });

              // 3. Play elegant notification chime sound
              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1423/1423-84.wav');
                audio.volume = 0.4;
                audio.play().catch(() => {});
              } catch (soundErr) {
                console.warn("Could not play chime:", soundErr);
              }

              // 4. Trigger premium in-app Live Product Alert modal
              setLiveProductAlert({
                title: item.title,
                category: item.category,
                price: item.price,
                product: item
              });
            }
          }
        });
      }

      setProducts(sorted);
      setProductsLoaded(true);
      safeStorage.setItem('sanad_cached_products', JSON.stringify(sorted));
      
      const searchParams = new URLSearchParams(window.location.search);
      const initialAdId = searchParams.get('ad');
      if (initialAdId) {
         const ad = sorted.find(p => p.id === initialAdId);
         if (ad) {
           setSelectedProduct(prev => prev ? prev : ad);
         }
      }
    }, (error: any) => {
      console.error("SanadSouq: Failed to sync products via onSnapshot. Error message:", error?.message || error);
      console.error("SanadSouq Error Code:", error?.code || 'unknown');
      if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
        (window as any).__sanadDiagnostics.firestoreError = error?.message || String(error);
        (window as any).__sanadDiagnostics.connectionStatus = `Syncing failed: ${error?.message || error}`;
        if (error?.code === 'permission-denied') {
          (window as any).__sanadDiagnostics.permissionError = error?.message || String(error);
        }
        (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
      }
      // Auto-recovery retry
      setTimeout(fetchInitialData, 3000);
    });
    
    // GET fallback for users
    getDocs(collection(db, 'systemUsers')).then(snapshot => {
      const users: any[] = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setSystemUsers(prev => prev.length > 0 ? prev : users);
      setUsersLoaded(true);
    }).catch((e: any) => console.error("SanadSouq: Users fast fetch failed with error:", e?.message || e));

    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'systemUsers'), (snapshot) => {
      const users: any[] = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setSystemUsers(users);
      setUsersLoaded(true);
    }, (error) => console.error("Listen users failed:", error));

    // Safety fallback: Ensure usersLoaded is set to true after 2.5 seconds regardless, in case of network latency or offline mode
    const fallbackTimer = setTimeout(() => {
      setUsersLoaded(true);
      setProductsLoaded(true); // also fallback products
    }, 2500);

    // GET fallback for requests
    getDocs(collection(db, 'systemRequests')).then(snapshot => {
      const reqs: any[] = [];
      snapshot.forEach(doc => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      setSystemRequests(prev => prev.length > 0 ? prev : reqs);
    }).catch(e => console.error("Requests fast fetch failed:", e));

    // Listen to requests
    const unsubRequests = onSnapshot(collection(db, 'systemRequests'), (snapshot) => {
      const reqs: any[] = [];
      snapshot.forEach(doc => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      setSystemRequests(reqs);
    }, (error) => {
      console.error("Failed to sync systemRequests:", error);
    });

    // Listen to broadcasts
    const unsubBroadcasts = onSnapshot(collection(db, 'broadcasts'), (snapshot) => {
      const msgs: BroadcastMessage[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as BroadcastMessage);
      });
      // Sort client-side
      msgs.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      console.log('--- BROADCAST LOG ---', msgs);
      setBroadcastQueue(msgs);
    }, (error) => {
      console.error("Failed to sync broadcasts:", error);
    });

    return () => {
      unsubProducts();
      unsubUsers();
      unsubRequests();
      unsubBroadcasts();
      clearTimeout(fallbackTimer);
    };
  }, []);
  const [notificationsCount, setNotificationsCount] = useState(() => {
    const saved = safeStorage.getItem('sanad_last_seen_requests_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [userNotifications, setUserNotifications] = useState<any[]>(() => {
    try {
      const saved = safeStorage.getItem('sanad_user_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(() => {
    // Show welcome message to everyone (visitor/logged in). Shared ad links hide it.
    if (window.location.search.includes('ad=')) return false;
    return true;
  });
  const [loggedUserObj, setLoggedUserObj] = useState<any>(() => {
    try {
      const saved = safeStorage.getItem('sanad_current_user_obj');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isPublishingTransition, setIsPublishingTransition] = useState(false);

  useEffect(() => {
    if (loggedUserObj) {
        safeStorage.setItem('sanad_current_user_obj', JSON.stringify(loggedUserObj));
    } else {
        safeStorage.removeItem('sanad_current_user_obj');
    }
  }, [loggedUserObj]);
  const [transitionPlan, setTransitionPlan] = useState<'free' | 'bronze' | 'vip'>('free');

  const [currentUserPlan, setCurrentUserPlan] = useState<'free' | 'bronze' | 'vip'>(() => {
    const saved = safeStorage.getItem('sanad_current_user_plan');
    return (saved as 'free' | 'bronze' | 'vip') || 'free';
  });
  const [currentUserPhone, setCurrentUserPhone] = useState<string | null>(() => {
    return safeStorage.getItem('sanad_current_user_phone');
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = safeStorage.getItem('sanad_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = safeStorage.getItem('sanad_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('sanad_favorite_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [liveProductAlert, setLiveProductAlert] = useState<any>(null);

  const appOpenTimeRef = useRef<number>(Date.now());
  const favoriteCategoriesRef = useRef<string[]>(favoriteCategories);
  const productsRef = useRef<Product[]>([]);

  useEffect(() => {
    favoriteCategoriesRef.current = favoriteCategories;
  }, [favoriteCategories]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  useEffect(() => {
    // Defer heavy DOM rendering after the first paint
    const timer = setTimeout(() => {
      setInitialRenderComplete(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSplashActive, setIsSplashActive] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.has('ad')) return false;
      }
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Automatically update the region filter if the search query is a known region (full or partial match)
  useEffect(() => {
     const q = searchQuery.trim().toLowerCase();
     if (q) {
        const match = REGIONS.find(r => r !== 'الكل' && (r.toLowerCase().includes(q) || q.includes(r.toLowerCase())));
        if (match) {
           setSelectedRegion(match);
           // Scroll to the selected region in the regionsContainer to center it perfectly
           setTimeout(() => {
              const selectedButton = regionRefs.current[match];
              if (selectedButton) {
                  selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
           }, 50);
        }
     } else {
        setSelectedRegion('الكل');
     }
  }, [searchQuery]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [broadcastQueue, setBroadcastQueue] = useState<BroadcastMessage[]>([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<Set<string>>(new Set());

  const playPremiumGoldChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Beautiful celestial sequence of notes: D5 -> A5 -> D6 -> A6
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // High frequency shimmer for the golden touch
        osc.type = freq > 1000 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
        gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Celestial gold chord chime
      playTone(587.33, 0, 0.6, 0.12);      // D5
      playTone(880.00, 0.08, 0.7, 0.10);   // A5
      playTone(1174.66, 0.16, 0.9, 0.08);  // D6 (high sparkle)
      playTone(1760.00, 0.24, 1.2, 0.05);  // A6 (royal shimmer)
    } catch (error) {
      console.warn('Audio synthesis failed, skipping notification sound', error);
    }
  };

  const triggerBroadcast = async (sellerName: string, location: string, title: string, plan: 'vip' | 'bronze' | 'free', avatar?: string, forceBroadcast: boolean = false) => {
    const isAdmin = currentUserPhone === '92942482';
    const resolvedPlan = isAdmin ? 'vip' : plan;
    if (!forceBroadcast && resolvedPlan !== 'vip') return;
    
    // Play the signature golden notification chime sound!
    playPremiumGoldChime();

    const newMessage = {
      sellerName,
      location,
      title,
      plan: resolvedPlan,
      avatar,
      createdAt: new Date().toISOString()
    };
    
    try {
      await addDoc(collection(db, 'broadcasts'), newMessage);
    } catch (e) {
      console.error("Error broadcasting message:", e);
    }
  };

  // Broadcast system is ready for user triggers on submission only

  // History tracker
  useEffect(() => {
      if (selectedProduct) {
          setRecentlyViewed(prev => [selectedProduct.id, ...prev.filter(id => id !== selectedProduct.id)].slice(0, 5));
      }
  }, [selectedProduct]);

  useEffect(() => {
    safeStorage.setItem('sanad_system_requests', JSON.stringify(systemRequests));
  }, [systemRequests]);

  useEffect(() => {
    safeStorage.setItem('sanad_last_seen_requests_count', notificationsCount.toString());
  }, [notificationsCount]);

  useEffect(() => {
    safeStorage.setItem('sanad_user_notifications', JSON.stringify(userNotifications));
  }, [userNotifications]);

  useEffect(() => {
    safeStorage.setItem('sanad_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    safeStorage.setItem('sanad_recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    safeStorage.setItem('sanad_current_user_plan', currentUserPlan);
  }, [currentUserPlan]);

  // Track last visited web origin dynamically to support self-healing configurations in the built APK wrapper
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      const isApk = window.location.protocol === 'file:' || 
                    window.location.protocol.startsWith('capacitor') || 
                    window.location.protocol.startsWith('ionic') ||
                    !window.location.hostname;
      if (!isApk) {
        safeStorage.setItem('sanad_last_web_origin', window.location.origin);
      }
    }
  }, []);

  // Synchronize currentUserPlan with system database changes dynamically so plan transitions are immediate
  useEffect(() => {
    const userObj = systemUsers.find(u => u.phone === currentUserPhone || u.id === currentUserPhone);
    const isAdmin = currentUserPhone === '92942482';
    const resolvedPlan = isAdmin ? 'vip' : (userObj?.plan || 'free');
    if (userObj && resolvedPlan !== currentUserPlan) {
      setCurrentUserPlan(resolvedPlan);
    }
  }, [systemUsers, currentUserPhone, currentUserPlan]);

  const handleDismissBroadcast = (id: string) => {
    setBroadcastQueue(prev => prev.filter(b => b.id !== id));
  };

  // PWA & Browser App Installation Triggers
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isDismissed = safeStorage.getItem('sanad_app_install_dismissed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    let timer: NodeJS.Timeout | null = null;
    if (!isStandalone && !isDismissed) {
      timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 5000);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [storyViewerId, setStoryViewerId] = useState<string | null>(null);
  const [directPaymentPkg, setDirectPaymentPkg] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'warning' | 'error'} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (currentUserPhone) {
      safeStorage.setItem('sanad_current_user_phone', currentUserPhone);
    } else {
      safeStorage.removeItem('sanad_current_user_phone');
    }
  }, [currentUserPhone]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedRegion, setSelectedRegion] = useState('الكل');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);
  const autoSuggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autoSuggestRef.current && !autoSuggestRef.current.contains(event.target as Node)) {
        setShowAutoSuggest(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Back button handling integration for APKs and mobile browsers
  const lastStateRef = useRef<boolean>(false);
  useEffect(() => {
    const isAnyModalOpen = showAdmin || showSidebar || showAuth || showProfile || showAddProduct || showAIChat || !!storyViewerId;
    
    if (isAnyModalOpen && !lastStateRef.current) {
      window.history.pushState({ modalOpen: true }, '', '#overlay');
    } else if (!isAnyModalOpen && lastStateRef.current) {
      if (window.location.hash === '#overlay') {
        window.history.back();
      }
    }
    lastStateRef.current = isAnyModalOpen;
    
    const handlePopState = (e: PopStateEvent) => {
      if (window.location.hash !== '#overlay') {
        setShowAdmin(false);
        setShowSidebar(false);
        setShowAuth(false);
        setShowProfile(false);
        setShowAddProduct(false);
        setShowAIChat(false);
        setStoryViewerId(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showAdmin, showSidebar, showAuth, showProfile, showAddProduct, showAIChat, storyViewerId]);

  const getSuggestions = () => {
    if (!searchQuery.trim()) return { productMatches: [], categoryMatches: [] };
    const q = searchQuery.toLowerCase();
    const productMatches = products
      .filter(p => p.title.toLowerCase().includes(q))
      .slice(0, 5);
    const categoryMatches = CATEGORIES.filter(c => c !== 'الكل' && c.toLowerCase().includes(q)).slice(0, 3);
    return { productMatches, categoryMatches };
  };

  const mainRef = useRef<HTMLElement>(null);
  const regionsContainerRef = useRef<HTMLDivElement>(null);
  const regionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const touchStartY = useRef(0);

  // Handle Haptic Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
     if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
     }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     if (window.scrollY === 0 && touchStartY.current !== 0) {
         const currentY = e.touches[0].clientY;
         if (currentY - touchStartY.current > 100 && !isRefreshing) {
             setIsRefreshing(true);
             triggerHaptic(50); // Haptic feedback
             setTimeout(() => {
                setIsRefreshing(false);
                triggerHaptic([30, 50, 30]); // Success chime pattern
             }, 1500);
         }
     }
  };

  const handleTouchEnd = () => {
      touchStartY.current = 0;
  };

  const pendingRequest = systemRequests.find(r => r.phone === currentUserPhone && r.status === 'pending');
  const currentUserObj = systemUsers.find(u => u.phone === currentUserPhone || u.id === currentUserPhone);

  // Auto clean-up stale or invalid user sessions is disabled to avoid race conditions during signup
  useEffect(() => {
    /* 
    if (usersLoaded && currentUserPhone && !systemUsers.some(u => u.phone === currentUserPhone)) {
      setCurrentUserPhone(null);
      setCurrentUserPlan('free');
      setLoggedUserObj(null);
    }
    */
  }, [currentUserPhone, systemUsers, usersLoaded]);

  // For Admin auto-sync of product plans (self-healing)
  useEffect(() => {
     if (currentUserPhone === '92942482' && products.length > 0 && systemUsers.length > 0) {
        products.forEach(p => {
           const u = systemUsers.find(su => su.phone === p.sellerId || su.id === p.sellerId);
           if (u && u.plan && p.plan !== u.plan) {
              updateDoc(doc(db, 'products', p.id), { plan: u.plan }).catch(console.error);
           }
        });
     }
  }, [currentUserPhone, products, systemUsers]);

  // Sync loggedUserObj whenever currentUserPhone or systemUsers changes
  useEffect(() => {
    if (currentUserPhone) {
      const user = systemUsers.find(u => u.phone === currentUserPhone || u.id === currentUserPhone);
      if (user) {
        setLoggedUserObj(user);
        if (user.favoriteCategories && Array.isArray(user.favoriteCategories)) {
          setFavoriteCategories(user.favoriteCategories);
          safeStorage.setItem('sanad_favorite_categories', JSON.stringify(user.favoriteCategories));
        }
      }
    } else {
      setLoggedUserObj(null);
    }
  }, [currentUserPhone, systemUsers]);

  const handleAuth = async (isLogin: boolean, rawPhone: string, rawName: string, rawCode: string): Promise<boolean | string> => {
      const englishPhone = rawPhone.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
      const phone = englishPhone.trim().replace(/\s+/g, '');
      const englishCode = rawCode.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
      const code = englishCode.trim();
      const name = rawName.trim();
      
      const isAdmin = phone === '92942482';

      if (!usersLoaded) {
          return 'يرجى الانتظار للحظات حتى اكتمال تحميل معلومات الأعضاء...';
      }

      if (isLogin) {
          let user: any = systemUsers.find(u => u.phone === phone || u.id === phone);

          if (!user) {
              if (isAdmin) {
                  user = { name: 'المدير', phone: phone, plan: 'vip', avatar: null, password: code };
                  setDoc(doc(db, 'systemUsers', phone), user).catch(e => console.error(e));
              } else {
                  return 'رقم الهاتف غير مسجل، يرجى إنشاء حساب أولاً';
              }
          }

          if (user && !user.password && !isAdmin) {
              updateDoc(doc(db, 'systemUsers', phone), { password: code }).catch(e => console.error(e));
              user.password = code;
          }

          if (isAdmin || String(user.password) === code) {
              if (isAdmin && user.password !== code) {
                  updateDoc(doc(db, 'systemUsers', phone), { password: code }).catch(e => console.error(e));
              }

              const finalPlan = isAdmin ? 'vip' : (user.plan || 'free');
              
              setCurrentUserPhone(phone);
              setCurrentUserPlan(finalPlan);
              setShowAuth(false);
              const loggedUser = {...user, plan: finalPlan, password: code};
              setLoggedUserObj(loggedUser);
              setShowWelcomeSplash(true);
              try { playLoginSound(); } catch (e) { console.error(e); }
              return true;
          } else {
              return 'بيانات الدخول غير صحيحة';
          }
      } else {
          console.log('--- SIGNUP INITIATED ---');
          console.log('Input Phone:', phone);
          console.log('All System Users:', systemUsers.map(u => ({ id: u.id, phone: u.phone, name: u.name })));
          
          let existingUser: any = null;
          if (phone && phone.trim().length >= 4) {
              existingUser = systemUsers.find(u => {
                  const checkPhone = u.phone ? String(u.phone).trim().replace(/\s+/g, '') : null;
                  const checkId = u.id ? String(u.id).trim().replace(/\s+/g, '') : null;
                  
                  const isPhoneMatch = checkPhone ? (checkPhone.length >= 4 && checkPhone === phone) : false;
                  const isIdMatch = checkId ? (checkId.length >= 4 && checkId === phone) : false;
                  
                  const isMatch = isPhoneMatch || isIdMatch;
                  if (isMatch) {
                      console.log('Matched existing user in loaded state:', u);
                  }
                  return isMatch;
              });
          }
          
          if (existingUser) {
              console.log('Duplicate user found, preventing signup or self-healing:', existingUser);
              if (isAdmin) {
                  return handleAuth(true, rawPhone, rawName, rawCode);
              }
              if (existingUser.password && String(existingUser.password) === code) {
                  console.log('Password matches existing user, performing automatic self-healing login.');
                  setCurrentUserPhone(phone);
                  setCurrentUserPlan((existingUser.plan || 'free') as "free" | "bronze" | "vip");
                  setShowAuth(false);
                  const loggedUser = { ...existingUser, id: existingUser.id || phone };
                  setLoggedUserObj(loggedUser);
                  setShowWelcomeSplash(true);
                  try { playLoginSound(); } catch (e) { console.error(e); }
                  return true;
              }
              return `رقم الهاتف مسجل مسبقاً (Matches: ${existingUser.name || 'No Name'} | Phone: ${existingUser.phone || 'No Phone'} | ID: ${existingUser.id})`;
          }
          
          const newUser = { name: (isAdmin && !name ? 'المدير' : name), phone, plan: isAdmin ? 'vip' : 'free', avatar: null, password: code };
          setDoc(doc(db, 'systemUsers', phone), newUser)
            .catch(e => {
              console.error('Error saving user to Firestore in background:', e);
            });
          
          // Broadcast new user
          triggerBroadcast(
              newUser.name,
              'سوق سند',
              'انضم إلينا مستخدم جديد!',
              'free',
              undefined,
              true
          );
          
          setCurrentUserPhone(phone);
          setCurrentUserPlan(newUser.plan as "free" | "bronze" | "vip");
          setShowAuth(false);
          const loggedUser = {...newUser, id: phone};
          setLoggedUserObj(loggedUser);
          setShowWelcomeSplash(true);
          try { playLoginSound(); } catch (e) { console.error(e); }
          return true;
      }
  };

  const handleToggleFavoriteCategory = async (category: string) => {
    const updated = favoriteCategories.includes(category)
      ? favoriteCategories.filter(c => c !== category)
      : [...favoriteCategories, category];
      
    setFavoriteCategories(updated);
    safeStorage.setItem('sanad_favorite_categories', JSON.stringify(updated));
    
    if (currentUserPhone) {
      try {
        await setDoc(doc(db, 'systemUsers', currentUserPhone), { favoriteCategories: updated }, { merge: true });
        showToast(`تم التحديث: ${category}`, 'success');
      } catch (dbErr) {
        console.error("Failed to save remote favorite categories:", dbErr);
      }
    } else {
      showToast(`تم حفظ القسم في المفضلة المحلية بالمتصفح 🌟`, 'success');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('المتصفح لا يدعم التنبيهات الفورية', 'error');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      if (permission === 'granted') {
        showToast('تم تفعيل التنبيهات بنجاح! ستصلك إشعارات فورية عن أقسامك المفضلة 🎉', 'success');
        
        if (messaging) {
          try {
            const { getToken } = await import('firebase/messaging');
            const token = await getToken(messaging, {
              vapidKey: 'BM-S9S3P9s-fscXl157e_5y1x3Yn9r-r9s-zXl8z1z...'
            }).catch(err => {
              console.warn("Could not retrieve FCM registration token:", err);
              return null;
            });
            
            if (token && currentUserPhone) {
              await setDoc(doc(db, 'systemUsers', currentUserPhone), { fcmToken: token }, { merge: true });
            }
          } catch (swErr) {
            console.warn("FCM registration error wrapper:", swErr);
          }
        }
      } else if (permission === 'denied') {
        showToast('تم رفض الإشعارات. يرجى تفعيلها من إعدادات المتصفح لتلقي التنبيهات.', 'warning');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      showToast('حدث خطأ أثناء طلب الإذن بالتنبيهات.', 'error');
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    const isAdmin = currentUserPhone === '92942482';
    if (isAdmin) {
      newProduct.plan = 'vip';
    }
    // Ensure comments, views and likes are initialized for new products
    const adWithStats = { ...newProduct, comments: [], views: 0, likes: 0 };
    if (!adWithStats.id || adWithStats.id.startsWith('temp-')) {
       adWithStats.id = crypto.randomUUID(); // ensure clean ID
    }

    // 1. Activate the majestic full-screen luxury transition scene matching the user's plan
    setTransitionPlan(isAdmin ? 'vip' : currentUserPlan);
    setIsPublishingTransition(true);

    // 2. Perform DB write in the background completely asynchronously to avoid blocking UI or freezing
    setDoc(doc(db, 'products', adWithStats.id), cleanUndefined(adWithStats))
      .catch((err) => {
        console.error('Failed to publish product to Database:', err);
        showToast('حدث خطأ أثناء الاتصال بالنظام، ولكن سنحاول جاهدين المزامنة بالخلفية.', 'error');
      });

    // 3. Run UI cleanup and transition timelines in a predictable, high-performance, responsive manner
    setTimeout(() => {
      // 4. Update products and clear all filters silently behind the scenes
      setShowAddProduct(false);
      setSelectedCategory('الكل');
      setSelectedRegion('الكل');
      setSearchQuery('');

      // 5. Reset the scroll instantly to (0,0) - NO browser stutter or white screen as the overlay covers it!
      window.scrollTo({ top: 0 });

      // INSTANT UI UPDATE: Prepend locally so the user sees it immediately even before Firestore syncs back!
      setProducts(prev => {
        if (prev.some(p => p.id === adWithStats.id)) return prev;
        return [adWithStats, ...prev];
      });

      // 6. Add REAL dynamic action-oriented notifications for both the publisher and the admin
      const notifyUsers = new Set<string>();
      if (currentUserPhone) notifyUsers.add(currentUserPhone);
      notifyUsers.add('92942482'); // target admin as well
      
      const newNotifications = Array.from(notifyUsers).map(phone => ({
        id: String(Date.now()) + '-' + phone + '-' + Math.random().toString(36).substr(2, 5),
        userPhone: phone,
        message: `📢 تم نشر إعلان جديد بنجاح: "${newProduct.title}" تفاصيل العرض ووصف المنتج متوفرة الآن! كتب بواسطة: ${newProduct.sellerName || 'مستعمل متميز'} (${newProduct.sellerId || 'بدون هاتف'}). اضغط هنا للمعاينة والموافقة الفورية.`,
        read: false,
        createdAt: new Date().toISOString(),
        productId: newProduct.id
      }));

      setUserNotifications(prev => [...newNotifications, ...prev]);

      // 7. Launch celebratory confetti burst
      confetti({
          particleCount: 155,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#D4AF37', '#10B981', '#ffffff']
      });

      // Play tailored confirmation sound (royal/vip, bronze, or free)
      try {
        playListingSound(newProduct.plan || 'free');
      } catch (e) {
        console.error(e);
      }

      // 7. Show modern floating success toast
      showToast('تم نشر إعلانك وبث الإشعار وحفظ تفاصيله للمعاينة!', 'success');

      // 8. Gracefully fade out the luxury transition overlay after all rendering is finalized
      setTimeout(() => {
        setIsPublishingTransition(false);
        // Broadcast newly published product in immediate TikTok-Universe luxury ticker style AFTER the overlay fades!
        triggerBroadcast(
          newProduct.sellerName || 'مستعمل متميز', 
          newProduct.location || 'تونس', 
          newProduct.title, 
          newProduct.plan || 'free', 
          newProduct.sellerAvatar
        );
      }, 1500);

    }, 1800);
  };

  const toggleFavorite = useCallback(async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const isAdding = !prev.includes(productId);
      const newFavs = isAdding ? [...prev, productId] : prev.filter(id => id !== productId);
      
      // We can't access `products` easily in the memoized version without adding it to deps,
      // but we can update the db asynchronously
      const updateDB = async () => {
         try {
           const productDoc = await getDoc(doc(db, 'products', productId));
           if (productDoc.exists()) {
             const prodData = productDoc.data();
             const newLikes = Math.max(0, (prodData.likes || 0) + (isAdding ? 1 : -1));
             await updateDoc(doc(db, 'products', productId), { likes: newLikes });
           }
         } catch (err) {
           console.error('Could not update likes', err);
         }
      };
      updateDB();
      
      showToast(isAdding ? 'تم الإعجاب بالمنتج' : 'تمت إزالة الإعجاب', 'info');
      return newFavs;
    });
  }, [showToast]);

  const handleSubscriptionRequest = async (plan: string) => {
    if (!currentUserPhone) {
        setShowAuth(true);
        return;
    }
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newReq = {
        id: newId,
        user: `User ${currentUserPhone}`,
        phone: currentUserPhone,
        plan,
        status: 'pending'
    };
    try {
        await setDoc(doc(db, 'systemRequests', newId), newReq);
        try { playSubscriptionClapSound(); } catch (e) { console.error(e); }
        confetti({
           particleCount: 88,
           spread: 60,
           origin: { y: 0.7 },
           colors: ['#D4AF37', '#ffffff']
        });
        showToast('تم إرسال طلب الاشتراك، سيتم تفعيل باقتك بعد تأكيد الدفع', 'success');
    } catch (e) {
        console.error("Failed to add subscription request to Firestore:", e);
        // Fallback to local state if offline/network issues
        setSystemRequests(prev => [newReq, ...prev]);
        showToast('تم إرسال طلب الاشتراك، ولكن قد يستغرق المزامنة وقتاً أطول.', 'info');
    }
  };

  const allEnrichedProducts = useMemo(() => products.map(p => {
    const userObj = systemUsers.find(u => u.phone === p.sellerId || u.id === p.sellerId);
    const isSellerAdmin = p.sellerId === '92942482';
    const rawPlan = userObj?.plan || p.plan;
    const resolvedPlan = isSellerAdmin ? 'vip' : (rawPlan || 'free');
    return {
      ...p,
      sellerName: isSellerAdmin ? 'المدير' : (userObj?.name || p.sellerName),
      sellerAvatar: userObj?.avatar || p.sellerAvatar,
      plan: resolvedPlan
    };
  }), [products, systemUsers]);

  const filteredProducts = useMemo(() => allEnrichedProducts.filter(p => {
      const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchReg = selectedRegion === 'الكل' || p.location.includes(selectedRegion);
      
      const q = searchQuery.trim().toLowerCase();
      const isSearchingRegion = q && REGIONS.some(r => r !== 'الكل' && (r.toLowerCase().includes(q) || q.includes(r.toLowerCase())));
      
      const matchSearch = isSearchingRegion
         ? true 
         : (!searchQuery.trim() || 
            (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchReg && matchSearch;
  }), [allEnrichedProducts, selectedCategory, selectedRegion, searchQuery]);

  const enrichedProducts = filteredProducts;

  const [generalPage, setGeneralPage] = useState(1);
  const PAGE_SIZE = 1000;

  useEffect(() => {
    setGeneralPage(1);
  }, [selectedCategory, selectedRegion, searchQuery]);

  const vipProducts = useMemo(() => {
    const list = enrichedProducts.filter(p => p.plan === 'vip');
    return initialRenderComplete ? list : list.slice(0, 4);
  }, [enrichedProducts, initialRenderComplete]);

  const bronzeProducts = useMemo(() => {
    const list = enrichedProducts.filter(p => p.plan === 'bronze');
    return initialRenderComplete ? list : list.slice(0, 4);
  }, [enrichedProducts, initialRenderComplete]);
  
  const allGeneralProducts = useMemo(() => enrichedProducts.filter(p => p.plan === 'free' || !p.plan), [enrichedProducts]);
  
  const generalProducts = useMemo(() => allGeneralProducts.slice(0, initialRenderComplete ? generalPage * PAGE_SIZE : 4), [allGeneralProducts, generalPage, initialRenderComplete]);

  const stories: Story[] = useMemo(() => {
    console.log("SanadSouq Stories Engine: Calculating stories. Length of allEnrichedProducts is:", allEnrichedProducts.length);
    const rawVipAndBronze = allEnrichedProducts.filter(p => p.plan === 'vip' || p.plan === 'bronze');
    console.log("SanadSouq Stories Engine: Total products with plan 'vip' or 'bronze' is:", rawVipAndBronze.length, rawVipAndBronze);

    // Filter active VIP/Bronze products from allEnrichedProducts
    let filtered = allEnrichedProducts.filter(p => {
       if (p.plan !== 'vip' && p.plan !== 'bronze') return false;
       if (p.status === 'sold') return false;
       
       const tA = new Date(p.createdAt).getTime();
       if (isNaN(tA)) return true; // keep if invalid/missing date
       
       const now = Date.now();
       const diffHours = (now - tA) / (1000 * 60 * 60);
       return diffHours <= 360; // Keep in stories for 15 days (360 hours) instead of only 48h
    });

    console.log("SanadSouq Stories Engine: Filtered active/recent stories count:", filtered.length);

    // Fallback: if there are no VIP or Bronze products in the last 15 days, show all active VIP/Bronze products so the list is never empty
    if (filtered.length === 0) {
       console.log("SanadSouq Stories Engine: Active recent list is empty. Triggering non-expiry active VIP/Bronze fallback...");
       filtered = allEnrichedProducts.filter(p => {
          if (p.plan !== 'vip' && p.plan !== 'bronze') return false;
          if (p.status === 'sold') return false;
          return true;
       });
       console.log("SanadSouq Stories Engine: Fallback found active VIP/Bronze count:", filtered.length);
    }

    const result = filtered
     .sort((a, b) => {
        const score = (x: any) => {
           if (x.plan === 'vip') return 20000;
           if (x.plan === 'bronze') return 10000;
           return 0;
        };
        // Rotation: score + (views) + random jitter if views are similar, but keeping dates relevant
        const timeWeightA = new Date(a.createdAt).getTime() / 100000000;
        const timeWeightB = new Date(b.createdAt).getTime() / 100000000;
        
        const finalA = score(a) + (a.views || 0) * 10 + (isNaN(timeWeightA) ? 0 : timeWeightA);
        const finalB = score(b) + (b.views || 0) * 10 + (isNaN(timeWeightB) ? 0 : timeWeightB);

        return finalB - finalA;
     })
     .map(p => {
        return {
           id: p.id,
           sellerId: p.sellerId,
           sellerName: p.sellerName,
           title: p.title,
           sellerAvatar: p.sellerAvatar || 'https://via.placeholder.com/150',
           imageUrl: p.imageUrls?.[0] || 'https://via.placeholder.com/400',
           imageUrls: p.imageUrls || [],
           createdAt: p.createdAt,
           expiresAt: p.createdAt, // Just for typing, we do custom logic
           isVip: p.plan === 'vip',
           views: p.views || 0,
           price: p.price,
           category: p.category
        };
     });

    const vipCount = allEnrichedProducts.filter(p => p.plan === 'vip').length;
    const bronzeCount = allEnrichedProducts.filter(p => p.plan === 'bronze').length;
    if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
       (window as any).__sanadDiagnostics.vipProductsCount = vipCount;
       (window as any).__sanadDiagnostics.bronzeProductsCount = bronzeCount;
       (window as any).__sanadDiagnostics.rawVipBronzeCount = rawVipAndBronze.length;
       (window as any).__sanadDiagnostics.activeVipBronzeCount = filtered.length;
       (window as any).__sanadDiagnostics.storiesCount = result.length;
       (window as any).__sanadDiagnostics.lastUpdate = new Date().toISOString();
    }

    console.log("SanadSouq Stories Engine: Final mapped stories list length:", result.length, result);
    return result;
  }, [allEnrichedProducts]);

  const currentUserStats = {
    active: products.filter(p => p.sellerId === currentUserPhone && p.status === 'active').length,
    views: products.filter(p => p.sellerId === currentUserPhone).reduce((sum, p) => sum + (p.views || 0), 0),
    sold: products.filter(p => p.sellerId === currentUserPhone && p.status === 'sold').length
  };

  const handleProductClick = useCallback(async (productId: string, product: Product) => {
    // Determine the updated product with incremented views
    const updatedProduct = { ...product, views: (product.views || 0) + 1 };
    
    // Set the selected product for the modal with the latest stats
    setSelectedProduct(updatedProduct);
    
    window.history.pushState(null, '', `?ad=${productId}`);

    try {
      await updateDoc(doc(db, 'products', productId), { views: updatedProduct.views });
    } catch(err) {
      console.error('Error updating views', err);
    }
  }, []);

  const hasActiveBroadcast = (() => {
    try {
      const activeQueue = broadcastQueue.filter(b => !dismissedBroadcastIds.has(b.id));
      if (activeQueue.length === 0) return false;
      const saved = localStorage.getItem('sanad_broadcast_views');
      const viewCounts = saved ? JSON.parse(saved) : {};
      return activeQueue.some(msg => (viewCounts[msg.id] || 0) < 10);
    } catch {
      return broadcastQueue.filter(b => !dismissedBroadcastIds.has(b.id)).length > 0;
    }
  })();

  if (showDebugPage) {
    return (
      <DebugView 
        onBack={() => {
          setShowDebugPage(false);
          try {
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/');
            }
          } catch (e) {
            console.error(e);
          }
        }} 
        productsCount={products.length} 
      />
    );
  }

  return (
    <div id="app-root" className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#050505] text-white relative transition-all duration-300 ${hasActiveBroadcast ? 'pt-9' : ''}`} dir="rtl">
      {isSplashActive && <SplashScreen onComplete={() => setIsSplashActive(false)} />}
      
      <BroadcastMarquee 
        queue={broadcastQueue.filter(b => !dismissedBroadcastIds.has(b.id))} 
        onDismiss={(id) => { 
          setDismissedBroadcastIds(prev => {
            const updated = new Set(prev);
            updated.add(id);
            return updated;
          });
          handleDismissBroadcast(id); 
        }} 
      />
      
      {/* Header */}
      <div className={`pt-20 sm:pt-28 md:pt-36 lg:pt-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300 relative z-40 ${hasActiveBroadcast ? 'mt-[36px]' : ''}`}>
        <header className="bg-[#050505]/75 backdrop-blur-xl border border-white/10 rounded-2xl shrink-0 w-full shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-[70px] sm:h-[80px] relative">
              <div className="flex items-center gap-3 z-10">
                {/* Profile button directly in top-right corner */}
                <div 
                  className="flex flex-col items-center justify-center cursor-pointer group select-none relative shrink-0"
                  onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      if (currentUserPhone) { 
                        setShowProfile(true); 
                      } else { 
                        setShowAuth(true); 
                      } 
                  }} 
                >
                  {currentUserPhone ? (
                    <div className="flex flex-col items-center">
                      {/* Royal Frame according to package */}
                      <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${
                        currentUserPlan === 'vip' 
                          ? 'bg-gradient-to-tr from-[#D4AF37] via-[#FFD700] to-[#F3E5AB] animate-rainbow-glow shadow-[0_0_18px_rgba(212,175,55,0.6)]' 
                          : currentUserPlan === 'bronze' 
                            ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-400 shadow-[0_0_12px_rgba(217,119,6,0.4)] border border-amber-500/30' 
                            : 'bg-gradient-to-tr from-[#10B981] via-gray-750 to-gray-850 shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-500/20'
                      }`}>
                        <div className="w-full h-full rounded-full bg-[#0a0f0d] overflow-hidden relative flex items-center justify-center">
                          {currentUserObj?.avatar ? (
                            <img 
                              src={currentUserObj.avatar} 
                              alt={currentUserObj.name || 'Profile'} 
                              className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110" 
                            />
                          ) : (
                            // Stunning royal letter monogram
                            <span className={`text-[16px] sm:text-[18px] font-black tracking-tighter uppercase ${
                              currentUserPlan === 'vip' 
                                ? 'text-gradient-gold' 
                                : currentUserPlan === 'bronze' 
                                  ? 'text-amber-500' 
                                  : 'text-emerald-400'
                            }`}>
                              {currentUserObj?.name?.[0] || 'س'}
                            </span>
                          )}
                        </div>

                        {/* Overlapping micro-badge of the tier under the photo inside the frame */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center scale-90 sm:scale-100">
                          {currentUserPlan === 'vip' ? (
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black text-[7px] font-black px-2 py-0.5 rounded-full border border-white/40 shadow-xl whitespace-nowrap tracking-wide leading-none flex items-center gap-0.5">
                              👑 VIP
                            </span>
                          ) : currentUserPlan === 'bronze' ? (
                            <span className="bg-gradient-to-r from-amber-600 to-orange-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full border border-orange-400/50 shadow-md whitespace-nowrap leading-none">
                              🥉 متميز
                            </span>
                          ) : (
                            <span className="bg-[#050505] text-emerald-400 text-[6.5px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm whitespace-nowrap leading-none">
                              عضو
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <button 
                        type="button"
                        className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-gray-800 bg-[#050505] flex items-center justify-center group-hover:border-[#D4AF37] group-hover:bg-[#1a1a1a] group-hover:shadow-[0_0_12px_rgba(212,175,55,0.3)] transition-all duration-300 overflow-hidden relative"
                      >
                        <User className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Title */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible">
                <span className="text-[26px] sm:text-[30px] lg:text-[36px] font-black font-display tracking-tight text-white flex items-center gap-1.5 select-none drop-shadow-[0_0_12px_rgba(212,175,55,0.2)] whitespace-nowrap">
                  سوق <span className="bg-gradient-to-r from-[#D4AF37] via-yellow-250 to-[#9e7a2f] text-transparent bg-clip-text">سند</span>
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 z-10">
              {!currentUserPhone && (
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuth(true); }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold transition-all text-sm sm:text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.97] shrink-0 border border-emerald-400/50 cursor-pointer animate-pulse-slow lg:px-8 lg:py-3"
                >
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>دخول</span>
                </button>
              )}

              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (currentUserPhone) { setShowAddProduct(true); } else { setShowAuth(true); } }}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black px-4 py-2 lg:px-6 lg:py-3 rounded-full font-bold shadow-lg shadow-[#D4AF37]/20 hover:opacity-90 hover:scale-105 transition-all"
              >
                <PlusCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="lg:text-lg">إضافة إعلان</span>
              </button>

              {currentUserPhone && (
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setShowNotificationsModal(true);
                  }} 
                  className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#D4AF37]/30 bg-[#0a0a0a] flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#151515] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 group"
                  title="الإشعارات"
                >
                  <Bell className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform duration-300" />
                  {(() => {
                    const unreadCount = userNotifications.filter(n => n.userPhone === currentUserPhone && !n.read).length + 
                       (currentUserPhone === '92942482' ? notificationsCount : 0);
                    return unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[22px] h-[22px] sm:min-w-[24px] sm:h-[24px] px-1 bg-gradient-to-r from-red-600 to-rose-500 text-[12px] sm:text-[13px] text-white font-extrabold flex items-center justify-center rounded-full ring-2 ring-[#020806] shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-vibrate font-sans">
                        {unreadCount}
                      </span>
                    ) : null;
                  })()}
                </button>
              )}
              

            </div>
          </div>
        </div>
      </header>
    </div>

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`bg-red-500/95 text-white text-xs font-semibold py-2.5 px-4 w-full text-center shadow-md border-b border-red-600 sticky ${hasActiveBroadcast ? 'top-[112px]' : 'top-[76px]'} z-30 flex items-center justify-center gap-1.5 transition-all duration-300`}
          >
            <span>أنت تتصفح الإعلانات المحفوظة مؤقتاً (وضع أوفلاين) - سنقوم بتحديث البيانات تلقائياً فور استعادة الاتصال 🌐</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="max-w-7xl mx-auto px-4.5 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-28 md:pb-8 relative z-10 w-full overflow-x-hidden"
      >
        {isRefreshing && (
           <div className="flex justify-center mb-6">
              <div className="w-6 h-6 rounded-full border-2 border-t-[#D4AF37] border-gray-800 animate-spin" />
           </div>
        )}

        {/* VIP Stories Section */}
        <div className="mt-8 sm:mt-12 mb-6">
          <VipStoriesRow 
               stories={stories} 
               currentUserObj={currentUserObj}
               onProfileClick={() => {
                  if (currentUserPhone) {
                     setShowProfile(true);
                  } else {
                     setShowAuth(true);
                  }
               }}
               onStoryClick={(id) => {
                  setStoryViewerId(id);
          }} />
        </div>

        {/* Premium Banner removed */}

�


        {/* Filters */}
        <div className="space-y-6 mb-12 relative z-10">


           {/* Regions Selector */}
           <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 mr-2">تصفية حسب الولاية</span>
              <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide" ref={regionsContainerRef}>
                 <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 shrink-0">
                    <Globe className="w-4 h-4 text-[#10B981]" />
                 </div>
                 {REGIONS.map((reg, index) => (
                    <motion.button
                       whileTap={{ scale: 0.95 }}
                       type="button"
                       key={reg}
                       ref={(el) => { if (el) regionRefs.current[reg] = el; }}
                       onClick={() => setSelectedRegion(reg)}
                       className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedRegion === reg 
                             ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20 font-bold scale-102 border border-[#10B981]' 
                             : 'bg-[#050505] text-gray-400 border border-gray-800 hover:border-gray-600'
                       }`}
                    >
                       {reg}
                    </motion.button>
                 ))}
              </div>
           </div>

           {/* Hot Luxury Categories Divider & Slider */}
           <div className="flex flex-col gap-3 border-t border-gray-800/40 pt-5">
              <div className="flex items-center justify-between px-2">
                 <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    تصنيفات السوق الملكية
                 </span>
                 <span className="text-[10px] text-gray-600 font-mono">SANAD LUXURY SELECTION</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-5 pt-1 px-1 scrollbar-hide mask-fade-edges">
                 {[
                   { name: 'الكل', icon: Grid, color: 'emerald' },
                   { name: 'ملابس رجال', icon: Shirt, color: 'blue' },
                   { name: 'ملابس نساء', icon: User, color: 'rose' },
                   { name: 'ملابس اطفال', icon: Baby, color: 'orange' },
                   { name: 'ماكياج و اكسسوارات', icon: Star, color: 'purple' },
                   { name: 'عطورات', icon: Droplets, color: 'rose' },
                   { name: 'سيارات و دراجات', icon: Car, color: 'amber' },
                   { name: 'عقارات', icon: Home, color: 'cyan' },
                   { name: 'إلكترونيات', icon: Smartphone, color: 'indigo' },
                   { name: 'أثاث', icon: Package, color: 'lime' },
                   { name: 'أدوات منزلية', icon: Coffee, color: 'teal' },
                   { name: 'حيوانات', icon: PawPrint, color: 'yellow' }
                 ].map((catObj, index) => {
                    const IconComp = catObj.icon;
                    const isSelected = selectedCategory === catObj.name;
                    
                    const colorMap: Record<string, any> = {
                      emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'from-emerald-500/10', glow: 'shadow-emerald-500/10', depth: 'border-b-emerald-500/40', active: 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/30' },
                      blue: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'from-blue-500/10', glow: 'shadow-blue-500/10', depth: 'border-b-blue-500/40', active: 'bg-blue-500 text-black border-blue-400 shadow-blue-500/30' },
                      rose: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'from-rose-500/10', glow: 'shadow-rose-500/10', depth: 'border-b-rose-500/40', active: 'bg-rose-500 text-black border-rose-400 shadow-rose-500/30' },
                      orange: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'from-orange-500/10', glow: 'shadow-orange-500/10', depth: 'border-b-orange-500/40', active: 'bg-orange-500 text-black border-orange-400 shadow-orange-500/30' },
                      purple: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/10', glow: 'shadow-purple-500/10', depth: 'border-b-purple-500/40', active: 'bg-purple-500 text-black border-purple-400 shadow-purple-500/30' },
                      amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'from-amber-500/10', glow: 'shadow-amber-500/10', depth: 'border-b-amber-500/40', active: 'bg-amber-500 text-black border-amber-400 shadow-amber-500/30' },
                      cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-500/10', glow: 'shadow-cyan-500/10', depth: 'border-b-cyan-500/40', active: 'bg-cyan-500 text-black border-cyan-400 shadow-cyan-500/30' },
                      indigo: { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'from-indigo-500/10', glow: 'shadow-indigo-500/10', depth: 'border-b-indigo-500/40', active: 'bg-indigo-500 text-black border-indigo-400 shadow-indigo-500/30' },
                      lime: { text: 'text-lime-400', border: 'border-lime-500/30', bg: 'from-lime-500/10', glow: 'shadow-lime-500/10', depth: 'border-b-lime-500/40', active: 'bg-lime-500 text-black border-lime-400 shadow-lime-500/30' },
                      teal: { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'from-teal-500/10', glow: 'shadow-teal-500/10', depth: 'border-b-teal-500/40', active: 'bg-teal-500 text-black border-teal-400 shadow-teal-500/30' },
                      yellow: { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'from-yellow-500/10', glow: 'shadow-yellow-500/10', depth: 'border-b-yellow-500/40', active: 'bg-yellow-500 text-black border-yellow-400 shadow-yellow-500/30' }
                    };
                    
                    const c = colorMap[catObj.color] || colorMap.emerald;

                    return (
                       <motion.button
                          type="button"
                          key={`${catObj.name}-${index}`}
                          onClick={() => setSelectedCategory(catObj.name)}
                          whileHover={{ scale: 1.05, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-black transition-all duration-300 flex items-center gap-1.5 border-t border-x ${
                             isSelected
                                ? `${c.active} border-b-0`
                                : `bg-gradient-to-b ${c.bg} to-[#030303] ${c.text} ${c.border} ${c.depth} ${c.glow} hover:border-[#D4AF37]/40`
                          }`}
                          style={{ 
                             transformStyle: 'preserve-3d',
                             perspective: '500px'
                          }}
                       >
                          <div className={`p-0.5 rounded-md ${isSelected ? 'bg-black/10' : 'bg-black/30'} border border-white/5`}>
                             <IconComp className={`w-3 h-3 ${isSelected ? 'text-black' : c.text}`} />
                          </div>
                          <span className="tracking-tighter">{catObj.name}</span>
                       </motion.button>
                    );
                 })}

              </div>
           </div>
        </div>
        


        {/* Section VIP */}
        <div className="mb-16" id="listings-head">
            <div className="flex flex-col items-center text-center justify-center gap-3 mb-10 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <Crown className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                 <h2 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">النخبة الملكية <span className="text-[#D4AF37]">VIP</span></h2>
                 <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">أرقى العروض والسلع الحصرية في تونس</p>
              </div>
            </div>
            {!productsLoaded ? (
              <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'}>
                {[...Array(5)].map((_, i) => <ListingSkeleton key={`sk-vip-${i}`} viewMode={viewMode} />)}
              </div>
            ) : vipProducts.length > 0 ? (
              <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'}>
                <AnimatePresence mode="popLayout">
                  {vipProducts.map((product, index) => (
                     <ListingCard 
                      key={`vip-${product.id}-${index}`} 
                      product={product} 
                      onClick={handleProductClick} 
                      searchQuery={searchQuery} 
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                      viewMode={viewMode}
                     />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState icon={Crown} title="لا توجد عروض" desc="لا توجد عروض VIP حالياً في هذا القسم" />
            )}
        </div>

        {/* Section Bronze */}
        <div className="mb-16">
            <div className="flex flex-col items-center text-center justify-center gap-3 mb-10 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#d97706]/20 to-transparent flex items-center justify-center border border-[#d97706]/30 shadow-[0_0_20px_rgba(217,119,6,0.1)]">
                <Star className="w-8 h-8 text-[#d97706]" />
              </div>
              <div>
                 <h2 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">عروض التميز <span className="text-[#d97706]">البرونزية</span></h2>
                 <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">اختياراتنا المميزة لبائعين موثوقين</p>
              </div>
            </div>
            {!productsLoaded ? (
              <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'}>
                {[...Array(5)].map((_, i) => <ListingSkeleton key={`sk-bronze-${i}`} viewMode={viewMode} />)}
              </div>
            ) : bronzeProducts.length > 0 ? (
              <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'}>
                <AnimatePresence mode="popLayout">
                  {bronzeProducts.map((product, index) => (
                     <ListingCard 
                      key={`bronze-${product.id}-${index}`} 
                      product={product} 
                      onClick={handleProductClick} 
                      searchQuery={searchQuery} 
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                      viewMode={viewMode}
                     />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState icon={Star} title="لا توجد عروض" desc="لا توجد عروض برونزية حالياً في هذا القسم" />
            )}
        </div>

        {/* Section General */}
        <div className="mb-8">
            <div className="flex flex-col items-center text-center justify-center gap-3 mb-10 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981]/20 to-transparent flex items-center justify-center border border-[#10B981]/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                 <ShoppingBag className="w-8 h-8 text-[#10B981]" />
              </div>
              <div>
                 <h2 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">القائمة العامة</h2>
                 <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">عروض سوقنا المتنوعة لكل الفئات</p>
              </div>
            </div>
            {!productsLoaded ? (
              <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'}>
                {[...Array(10)].map((_, i) => <ListingSkeleton key={`sk-general-${i}`} viewMode={viewMode} />)}
              </div>
            ) : generalProducts.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4 max-w-4xl mx-auto w-full' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 w-full'}>
                  <AnimatePresence mode="popLayout">
                    {generalProducts.map((product, index) => (
                       <ListingCard 
                        key={`general-${product.id}-${index}`} 
                        product={product} 
                        onClick={handleProductClick} 
                        searchQuery={searchQuery} 
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={toggleFavorite}
                        viewMode={viewMode}
                       />
                    ))}
                  </AnimatePresence>
                </div>
                {generalProducts.length < allGeneralProducts.length && (
                  <button 
                    onClick={() => setGeneralPage(p => p + 1)}
                    className="mt-10 px-8 py-3 bg-[#050505] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 rounded-full font-bold transition-all shadow-lg active:scale-95"
                  >
                    عرض المزيد من العروض
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon={ShoppingBag} title="لا توجد عروض" desc="لا توجد عروض حالياً في هذا القسم" />
            )}
        </div>
        
        {recentlyViewed.length > 0 && (
          <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 mr-4">شوهد مؤخراً</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
                  {recentlyViewed.map((id, index) => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;
                        return <div key={`recent-${p.id}-${index}`} className="cursor-pointer shrink-0 transition-transform hover:scale-105" onClick={() => handleProductClick(p.id, p)}><img src={p.imageUrls?.[0] || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-2xl object-cover border border-gray-800" /></div>;
                  })}
              </div>
          </div>
        )}

        {/* Pricing Packages */}
        <PricingPackages 
           onSubscriptionRequest={handleSubscriptionRequest} 
           hasPendingRequest={!!pendingRequest}
           showToast={showToast}
           currentUserPhone={currentUserPhone}
        />
        
        {directPaymentPkg && (
           <PaymentModal 
              packageId={directPaymentPkg} 
              onClose={() => setDirectPaymentPkg(null)} 
              onConfirm={() => {
                  handleSubscriptionRequest(directPaymentPkg);
                  setDirectPaymentPkg(null);
              }} 
           />
        )}
        
        <Footer />
      </main>
      
      <AnimatePresence>
         {showSidebar && (
            <Suspense key="suspense-sidebar" fallback={<ModalFallback />}>
               <Sidebar 
                  selectedCategory={selectedCategory} 
                  setSelectedCategory={setSelectedCategory} 
                  onClose={() => setShowSidebar(false)} />
            </Suspense>
         )}
         {showAdmin && (
            <Suspense key="suspense-admin" fallback={<ModalFallback />}>
               <AdminPanel 
                  onClose={() => setShowAdmin(false)}
               systemUsers={systemUsers}
               setSystemUsers={setSystemUsers}
               systemRequests={systemRequests}
               setSystemRequests={setSystemRequests}
               onAddUserNotification={(phone: string, msg: string) => {
                  const newNotif = {
                     id: String(Date.now()) + Math.random().toString(36).substr(2, 9),
                     userPhone: phone,
                     message: msg,
                     read: false,
                     createdAt: new Date().toISOString()
                  };
                  setUserNotifications(prev => [newNotif, ...prev]);
               }}
               products={products}
               setProducts={setProducts}
               notificationsCount={notificationsCount}
               setNotificationsCount={setNotificationsCount}
               showToast={showToast}
            />
         </Suspense>
         )}
         {showAuth && (
            <Suspense key="suspense-auth" fallback={<ModalFallback />}>
               <AuthModal key="auth" onClose={() => setShowAuth(false)} onAuth={handleAuth} />
            </Suspense>
         )}
            
            {/* Premium Live FCM Notification Popup Card */}
            <AnimatePresence>
              {liveProductAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="fixed top-24 left-4 right-4 md:left-auto md:right-8 z-50 max-w-sm w-full bg-[#050505]/95 backdrop-blur-2xl border border-[#D4AF37] rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  dir="rtl"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                      <Bell className="w-6 h-6 text-[#D4AF37] animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-0.5 rounded-full font-black">إشعار فوري للأقسام المفضلة</span>
                        <button onClick={() => setLiveProductAlert(null)} className="text-gray-500 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-white mt-2 leading-snug">{liveProductAlert.title}</h4>
                      <p className="text-[11px] text-[#10B981] mt-1 font-black">بسعر: {liveProductAlert.price} د.ت  •  قسم: {liveProductAlert.category}</p>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setSelectedProduct(liveProductAlert.product);
                            setLiveProductAlert(null);
                          }}
                          className="flex-1 py-2 bg-[#D4AF37] text-black text-xs font-black rounded-xl hover:bg-[#b59223] transition-colors cursor-pointer text-center"
                        >
                          معاينة الإعلان الفورية 👁️
                        </button>
                        <button
                          onClick={() => setLiveProductAlert(null)}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          تجاهل
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
         {showWelcomeSplash && (
            <Suspense key="suspense-welcome" fallback={<ModalFallback />}>
               <WelcomeSplashModal 
                  key="welcome-splash" 
                  user={loggedUserObj} 
                  onClose={() => {
                     setShowWelcomeSplash(false);
                  }} 
               />
            </Suspense>
         )}
         {storyViewerId && (
            <Suspense key="suspense-storyviewer" fallback={<ModalFallback />}>
               <StoryViewerModal
                  stories={stories}
                  initialStoryId={storyViewerId}
                  onClose={() => setStoryViewerId(null)}
                  onActionClick={(story) => {
                     const prod = products.find(p => p.id === story.id);
                     if (prod) {
                        handleProductClick(prod.id, prod);
                        setStoryViewerId(null);
                     }
                  }}
               />
            </Suspense>
         )}
         {showProfile && (
            <Suspense key="suspense-profile" fallback={<ModalFallback />}>
               <ProfileModal 
                  onClose={() => setShowProfile(false)} 
                  phone={currentUserPhone ?? undefined} 
                  currentUserPlan={currentUserPlan}
                  pendingPlan={pendingRequest?.plan}
                  stats={currentUserStats}
               currentUser={loggedUserObj}
               favoriteCategories={favoriteCategories}
               onToggleFavoriteCategory={handleToggleFavoriteCategory}
               notificationPermissionStatus={notificationPermissionStatus}
               onRequestNotificationPermission={handleRequestNotificationPermission}
               onSaveProfile={async (name, avatar) => {
                   if (!currentUserPhone) return;
                   try {
                     await setDoc(doc(db, 'systemUsers', currentUserPhone), { name, avatar }, { merge: true });
                     showToast('تم حفظ الملف الشخصي بنجاح', 'success');
                   } catch (e) {
                     console.error('Error saving profile', e);
                     showToast('حدث خطأ أثناء حفظ الملف الشخصي', 'error');
                   }
               }}
               onOpenAdmin={currentUserPhone === '92942482' ? () => { setShowAdmin(true); setShowProfile(false); } : undefined} 
               onLogout={() => { setCurrentUserPhone(null); setCurrentUserPlan('free'); setLoggedUserObj(null); }} 
            />
            </Suspense>
         )}
         {showAddProduct && (
         <Suspense key="suspense-addproduct" fallback={<ModalFallback />}>
            <AddProductModal key="addproduct" onClose={() => { setShowAddProduct(false); setEditingProduct(null); }} onAdd={(p) => handleAddProduct({...p, plan: currentUserPlan })} onEdit={async (p) => {
                 try {
                   await updateDoc(doc(db, 'products', p.id), cleanUndefined({
                      ...p
                   }));
                   setShowAddProduct(false);
                   setEditingProduct(null);
                   showToast('تم تحديث الإعلان بنجاح', 'success');
                 } catch (err) {
                   console.error("Failed to edit ad", err);
                   showToast('حدث خطأ أثناء تعديل الإعلان', 'error');
                 }
             }} currentUserPhone={currentUserPhone} currentUser={loggedUserObj} initialProduct={editingProduct} showToast={showToast} />
         </Suspense>
         )}
         {selectedProduct && (
         <Suspense key="suspense-details" fallback={<ModalFallback />}>
            <ProductDetailsModal 
              product={products.find(p => p.id === selectedProduct.id) || selectedProduct} 
              isFavorite={favorites.includes(selectedProduct.id)}
              onToggleFavorite={(e) => toggleFavorite(selectedProduct.id, e)}
              onClose={() => {
                setSelectedProduct(null);
                window.history.pushState(null, '', window.location.pathname);
              }} 
              currentUserPhone={currentUserPhone} 
              isAdmin={currentUserPhone === '92942482'} showToast={showToast} 
              onDelete={async () => {
                try {
                  await deleteDoc(doc(db, 'products', selectedProduct!.id));
                  showToast('تم حذف الإعلان بنجاح', 'success');
                  setSelectedProduct(null);
                } catch(err) {
                  console.error('Error deleting product', err);
                }
            }} onEdit={(product) => {
                setEditingProduct(product);
                setShowAddProduct(true);
            }} onUpdateComments={async (productId, updatedComments) => {
             try {
               await updateDoc(doc(db, 'products', productId), { comments: updatedComments });
               setSelectedProduct(prev => prev && prev.id === productId ? { ...prev, comments: updatedComments } : prev);
             } catch(err) {
               console.error('Error updating comments', err);
             }
         }} onAddNotification={(phone, message) => {
             const newNotif = {
                id: String(Date.now()) + Math.random().toString(36).substr(2, 9),
                userPhone: phone,
                message: message,
                read: false,
                createdAt: new Date().toISOString()
             };
             setUserNotifications(prev => [newNotif, ...prev]);
             showToast('تنبيه: تم تلقي تعليق جديد على إعلانك! 🔔', 'success');
         }} />
         </Suspense>
         )}
         {/* Notifications Modal for Regular Users */}
         {showNotificationsModal && (
            <motion.div 
               key="notifications"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
               onClick={() => {
                  setShowNotificationsModal(false);
               }}
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-gradient-to-b from-[#0a0a0a] to-[#020202] border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden text-right"
                  onClick={(e) => e.stopPropagation()}
               >
                  {/* Background gold aura decoration */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex justify-between items-center pb-4 border-b border-gray-900 mb-6 font-display">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                           <span className="text-sm">🔔</span>
                        </div>
                        <h3 className="text-lg font-black font-display text-white">إشعارات الحساب</h3>
                     </div>
                     {currentUserPhone === '92942482' && (
                        <button 
                           onClick={() => {
                              setShowNotificationsModal(false);
                              setShowAdmin(true);
                           }}
                           className="text-[10px] sm:text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-xl border border-[#D4AF37]/20 transition-all cursor-pointer"
                        >
                           لوحة الإدارة 🛡️ ({notificationsCount})
                        </button>
                     )}
                     <button 
                        onClick={() => {
                           setShowNotificationsModal(false);
                        }}
                        className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                     {userNotifications.filter(n => n.userPhone === currentUserPhone).length > 0 ? (
                        userNotifications
                          .filter(n => n.userPhone === currentUserPhone)
                          .map((n, index) => (
                             <div 
                                key={`${n.id}-${index}`} 
                                onClick={() => {
                                   setUserNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                                   if (n.productId) {
                                      const p = products.find(prod => prod.id === n.productId);
                                      if (p) {
                                         handleProductClick(p.id, p);
                                         setShowNotificationsModal(false);
                                      }
                                   }
                                }}
                                className={`p-4 rounded-2xl border cursor-pointer hover:bg-white/5 ${!n.read ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : 'border-gray-950 bg-black/40'} transition-all`}
                             >
                                <div className="flex items-start justify-between gap-3">
                                   <div className="flex items-start gap-3 flex-1">
                                      {!n.read ? (
                                         <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                         </div>
                                      ) : (
                                         <div className="w-8 h-8 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#10B981]">
                                            <span className="text-xs font-black">✓</span>
                                         </div>
                                      )}
                                      <div className="space-y-1 flex-1 text-right">
                                         <p className="text-white text-sm font-bold leading-relaxed">{n.message}</p>
                                         <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                            {new Date(n.createdAt).toLocaleDateString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                                         </p>
                                      </div>
                                   </div>
                                   <button
                                      type="button"
                                      title="حذف هذا الإشعار"
                                      onClick={(e) => {
                                         e.preventDefault();
                                         e.stopPropagation();
                                         setUserNotifications(prev => prev.filter(notif => notif.id !== n.id));
                                      }}
                                      className="p-1.5 self-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          ))
                     ) : (
                        <div className="text-center py-12 text-gray-500 space-y-3">
                           <span className="text-3xl inline-block animate-bounce">🔔</span>
                           <p className="text-xs">المستقبل هادئ، لا توجد إشعارات جديدة حالياً.</p>
                        </div>
                     )}
                  </div>

                  <button 
                     onClick={() => {
                        setUserNotifications(prev => prev.map(n => n.userPhone === currentUserPhone ? { ...n, read: true } : n));
                        setShowNotificationsModal(false);
                     }}
                     className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-extrabold text-sm rounded-xl hover:opacity-95 mt-6 transition-opacity cursor-pointer text-center font-display"
                  >
                     فهمت وتأكيد القراءة
                  </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
      
      <AnimatePresence>
         {isPublishingTransition && <PublishingTransition plan={transitionPlan} />}
      </AnimatePresence>
      
      <Toast toast={toast} onClose={() => setToast(null)} />
      
      {/* Facebook Page Trigger - Replaces the AI Assistant */}
      <div className="fixed bottom-28 md:bottom-16 right-12 md:right-20 z-40 animate-float-smooth">
         <div className="absolute inset-0 bg-[#1877F2]/30 rounded-full blur-xl opacity-45 animate-pulse pointer-events-none" />
         <a 
            href="https://www.facebook.com/share/1ENN1nm6tn/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="relative p-3 bg-gradient-to-tr from-[#1877F2] to-[#3b5998] text-white rounded-2xl shadow-[0_8px_30px_rgba(24,119,242,0.4)] border border-white/20 hover:scale-110 active:scale-95 flex items-center justify-center transition-all duration-300 group"
            title="صفحة فيسبوك سند"
         >
            <Facebook className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
         </a>
      </div>

      {/* WhatsApp Trigger - Swapped to bottom-left */}
      <a 
        href="https://wa.me/21692942482" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-28 md:bottom-16 left-12 md:left-20 z-40 p-3 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-2xl shadow-[0_8px_30px_rgba(37,211,102,0.4)] border border-white/20 hover:scale-110 transition-all animate-float-smooth"
        style={{ animationDelay: '1.5s' }}
      >
         <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
         </svg>
      </a>

      {/* Decorative Interactive Premium Floating Bottom Navigation Bar - New Slim 3D Design */}
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-black/90 backdrop-blur-lg border border-[#D4AF37]/25 rounded-[2rem] p-2 px-4 shadow-[0_12px_40px_rgba(212,175,55,0.12)] flex items-center justify-between" style={{ perspective: '800px' }}>
        {/* Tab: Home */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(30);
            setShowProfile(false);
            setShowAdmin(false);
            setShowAddProduct(false);
            setShowAIChat(false);
            setShowAuth(false);
            setStoryViewerId(null);
            setSelectedCategory('الكل');
            setSelectedRegion('الكل');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('app-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-all w-14 cursor-pointer"
        >
          <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
            <Home className="w-5.5 h-5.5 text-rose-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
            <span className="text-[11px] font-black font-display text-gray-100 group-hover:text-rose-300 select-none">الرئيسية</span>
          </div>
        </button>

        {/* Tab: Filter (Target Listings) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(30);
            const targetEl = document.getElementById('listings-head');
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-all w-14 cursor-pointer"
        >
          <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
            <Grid className="w-5.5 h-5.5 text-sky-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]" />
            <span className="text-[11px] font-black font-display text-gray-100 group-hover:text-sky-300 select-none">المعروضات</span>
          </div>
        </button>

        {/* Tab: Central Add Button - Slim Version */}
        <div className="relative w-[50px] h-10 flex items-center justify-center -mt-5 group">
          <div className="absolute inset-0 bg-[#D4AF37]/25 rounded-full blur-md opacity-70 pointer-events-none transition-opacity group-hover:opacity-100" />
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic([40, 20]);
              if (currentUserPhone) {
                setShowAddProduct(true);
              } else {
                setShowAuth(true);
              }
            }}
            className="absolute bg-gradient-to-b from-amber-400 to-amber-600 text-black w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all border-2 border-amber-300 cursor-pointer overflow-hidden z-10"
          >
            <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shine-sweep pointer-events-none" />
            <PlusCircle className="w-6 h-6 stroke-[2]" />
          </motion.button>
        </div>

        {/* Tab: Memberships (Pricing Packages) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(30);
            const targetEl = document.getElementById('paid-packages') || document.getElementById('pricing-packages');
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-all w-14 cursor-pointer"
        >
          <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
            <Crown className="w-5.5 h-5.5 text-[#D4AF37] mb-0.5 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[11px] font-black font-display text-[#D4AF37] group-hover:text-amber-300 select-none">العضويات</span>
          </div>
        </button>

        {/* Tab: Profile login or info */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(30);
            if (currentUserPhone) {
              setShowProfile(true);
            } else {
              setShowAuth(true);
            }
          }}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-all w-14 cursor-pointer"
        >
          <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
            {currentUserPhone ? (
               <User className="w-5.5 h-5.5 text-emerald-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
            ) : (
               <LogIn className="w-5.5 h-5.5 text-emerald-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
            )}
            <span className="text-[11px] font-black font-display text-gray-100 group-hover:text-emerald-300 select-none">
              {currentUserPhone ? 'حسابي' : 'الدخول'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
