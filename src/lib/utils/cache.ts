interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class LocalStorageCache {
  private prefix = "borgboklund_";
  private isClient = typeof window !== "undefined";

  set<T>(key: string, data: T, expiresInMs: number): void {
    if (!this.isClient) return;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  get<T>(key: string): T | null {
    if (!this.isClient) return null;

    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      const now = Date.now();

      if (now - item.timestamp > item.expiresIn) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isClient) return;

    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }

  clear(): void {
    if (!this.isClient) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }

  isExpired(key: string): boolean {
    if (!this.isClient) return true;

    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item: CacheItem<any> = JSON.parse(stored);
      const now = Date.now();

      return now - item.timestamp > item.expiresIn;
    } catch {
      return true;
    }
  }
}

export const cache = new LocalStorageCache();

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  WEATHER: 10 * 60 * 1000, // 10 minuter
  TRANSPORT: 5 * 60 * 1000, // 5 minuter
  TRAFFIC: 10 * 60 * 1000, // 10 minuter
  GARDEN: 30 * 60 * 1000, // 30 minuter
  POLLEN: 60 * 60 * 1000, // 1 timme
} as const;
