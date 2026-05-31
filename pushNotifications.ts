// Service for Web Push Notifications and in-app ambient notifications
import { safeStorage } from './safeStorage';

export interface PushSubscriptionConfig {
  enabled: boolean;
  permission: NotificationPermission | 'unsupported';
}

// Key for local storage
const STORAGE_KEY = 'sanad_push_notifications_config';

export function getPushConfig(): PushSubscriptionConfig {
  const saved = safeStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  
  const hasAPI = typeof window !== 'undefined' && 'Notification' in window;
  return {
    enabled: false,
    permission: hasAPI ? Notification.permission : 'unsupported',
  };
}

export function savePushConfig(config: PushSubscriptionConfig) {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    const config = getPushConfig();
    config.permission = permission;
    config.enabled = permission === 'granted';
    savePushConfig(config);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Plays a luxurious success notification sound via the Web Audio API
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play dual elegant chime notes
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Luxurious fade-out profile
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    // Chime C6 (1046.50Hz) then E6 (1318.51Hz) for an optimistic notification chord
    playNote(1046.50, now, 0.4);
    playNote(1318.51, now + 0.12, 0.55);
  } catch (err) {
    console.log('Web Audio chime not allowed or failed:', err);
  }
}

export function triggerPushNotification(title: string, body: string, iconUrl?: string) {
  // Always play the gorgeous audio chime
  playNotificationSound();

  if (typeof window === 'undefined') return;

  // Try standard web push notification if granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const options: NotificationOptions = {
        body,
        icon: iconUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
        badge: '/favicon.ico',
        dir: 'rtl',
        tag: 'comment-alert',
      };
      
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Native notification instantiation failed (possibly blocked in iframe):', err);
    }
  }
}
