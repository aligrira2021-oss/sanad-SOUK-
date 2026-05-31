import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, setLogLevel } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import firebaseConfigJson from "../firebase-applet-config.json";

// Support both AI Studio JSON config and Netlify/Vercel Environment Variables
const env = (import.meta as any).env || {};

const cleanVal = (val: any): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null' || trimmed === '[object Object]') return undefined;
  return trimmed;
};

const resolvedApiKey = cleanVal(env.VITE_FIREBASE_API_KEY) || (firebaseConfigJson as any).apiKey;
const resolvedProjectId = cleanVal(env.VITE_FIREBASE_PROJECT_ID) || (firebaseConfigJson as any).projectId;

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: cleanVal(env.VITE_FIREBASE_AUTH_DOMAIN) || (firebaseConfigJson as any).authDomain,
  projectId: resolvedProjectId,
  storageBucket: cleanVal(env.VITE_FIREBASE_STORAGE_BUCKET) || (firebaseConfigJson as any).storageBucket,
  messagingSenderId: cleanVal(env.VITE_FIREBASE_MESSAGING_SENDER_ID) || (firebaseConfigJson as any).messagingSenderId,
  appId: cleanVal(env.VITE_FIREBASE_APP_ID) || (firebaseConfigJson as any).appId,
  measurementId: cleanVal(env.VITE_FIREBASE_MEASUREMENT_ID) || (firebaseConfigJson as any).measurementId
};

// Mask sensitive key for secure diagnostic logging in the browser console
const maskKey = (key: string) => {
  if (!key) return "NONE";
  if (key.length <= 8) return "***";
  return key.slice(0, 4) + "..." + key.slice(-4);
};

// Global diagnostics tracking object
let initError: any = null;
if (typeof window !== 'undefined') {
  (window as any).__sanadDiagnostics = {
    firebaseInitialized: false,
    projectId: resolvedProjectId,
    hasApiKey: !!resolvedApiKey,
    maskedApiKey: maskKey(resolvedApiKey || ""),
    firebaseConfigKeys: Object.keys(firebaseConfig).filter(k => !!(firebaseConfig as any)[k]),
    initError: null,
    firestoreError: null,
    permissionError: null,
    connectionStatus: "Initializing",
    productsFetchedCount: -1,
    productsSnapshotCount: -1,
    vipProductsCount: 0,
    storiesCount: 0,
    activeVipBronzeCount: 0,
    rawVipBronzeCount: 0,
    lastUpdate: new Date().toISOString()
  };
}

console.log("SanadSouq - Firebase Init Diagnostics:", {
  resolvedProjectId,
  hasApiKey: !!resolvedApiKey,
  maskedApiKey: maskKey(resolvedApiKey || ""),
  usingEnvVars: !!(cleanVal(env.VITE_FIREBASE_PROJECT_ID) || cleanVal(env.VITE_FIREBASE_API_KEY)),
  firebaseConfigKeys: Object.keys(firebaseConfig).filter(k => !!(firebaseConfig as any)[k])
});

let app: any;
try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
    (window as any).__sanadDiagnostics.firebaseInitialized = true;
    (window as any).__sanadDiagnostics.connectionStatus = "App Initialized";
  }
} catch (e: any) {
  initError = e;
  if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
    (window as any).__sanadDiagnostics.initError = e?.message || String(e);
    (window as any).__sanadDiagnostics.connectionStatus = `App Init Failed: ${e?.message || e}`;
  }
  console.error("Firebase initializeApp failure:", e);
}

setLogLevel('error');
const config = firebaseConfig as any;
console.log("SanadSouq: Firebase Initialized with Project ID:", config.projectId);

let firestoreDb;
try {
  // Use a safer initialization that falls back gracefully without double-calling initializeFirestore
  firestoreDb = initializeFirestore(app, {
    localCache: typeof window !== 'undefined' ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : memoryLocalCache()
  }, config.firestoreDatabaseId || undefined);
  if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
    (window as any).__sanadDiagnostics.connectionStatus = "Firestore Initialized";
  }
} catch (e: any) {
  console.warn("Firestore initialization with persistence failed/blocked. Using default memory cache.", e);
  if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
    (window as any).__sanadDiagnostics.firestoreError = `Persistence warning: ${e?.message || e}`;
  }
  try {
    firestoreDb = getFirestore(app, config.firestoreDatabaseId || undefined);
    if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
      (window as any).__sanadDiagnostics.connectionStatus = "Firestore Initialized (Fallback)";
    }
  } catch (err: any) {
    console.error("Critical Firestore failure:", err);
    if (typeof window !== 'undefined' && (window as any).__sanadDiagnostics) {
      (window as any).__sanadDiagnostics.firestoreError = `Critical init error: ${err?.message || err}`;
      (window as any).__sanadDiagnostics.connectionStatus = "Firestore Critical Failure";
    }
  }
}

let messagingInstance: any = null;
try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messagingInstance = getMessaging(app);
  }
} catch (e) {
  console.warn("Firebase Messaging is not supported or blocked in this environment.", e);
}

export const db = firestoreDb;
export const messaging = messagingInstance;
export { app };

