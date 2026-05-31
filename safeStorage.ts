// A highly robust wrapper for localStorage to handle sandbox/iframe environments where storage access may be denied.
const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`localStorage disabled. Falling back to memory for key: "${key}"`, e);
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`localStorage disabled. Saving to memory for key: "${key}"`, e);
    }
    memoryStore[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable()) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`localStorage disabled. Removing from memory for key: "${key}"`, e);
    }
    delete memoryStore[key];
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable()) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn('localStorage clear failed.', e);
    }
    for (const key in memoryStore) {
      delete memoryStore[key];
    }
  }
};
