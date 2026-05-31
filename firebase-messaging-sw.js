// Firebase Cloud Messaging Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase App in service worker
firebase.initializeApp({
  apiKey: "AIzaSyB5qMzIOMZQTs-uFj6Y-AJmvA-F7kXRT0Q",
  authDomain: "starry-robot-r8gvj.firebaseapp.com",
  projectId: "starry-robot-r8gvj",
  storageBucket: "starry-robot-r8gvj.firebasestorage.app",
  messagingSenderId: "900108219926",
  appId: "1:900108219926:web:889cf9983f4bd8d91b2737"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'سوق سند 🔔';
  const notificationOptions = {
    body: payload.notification?.body || 'تم إضافة منتج جديد في الأقسام المفضلة لديك!',
    icon: '/favicon.ico',
    badge: 'https://img.icons8.com/color/192/000000/luxury.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
