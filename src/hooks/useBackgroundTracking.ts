import { useState, useEffect, useCallback, useRef } from 'react';

interface BackgroundTrackingState {
  isActive: boolean;
  isVisible: boolean;
  wakeLockSupported: boolean;
  wakeLockActive: boolean;
  lastActivity: number | null;
}

export const useBackgroundTracking = () => {
  const [state, setState] = useState<BackgroundTrackingState>({
    isActive: false,
    isVisible: true,
    wakeLockSupported: false,
    wakeLockActive: false,
    lastActivity: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wake Lock API のサポート確認
  const checkWakeLockSupport = useCallback(() => {
    const supported = 'wakeLock' in navigator;
    setState(prev => ({ ...prev, wakeLockSupported: supported }));
    return supported;
  }, []);

  // Wake Lock の取得
  const acquireWakeLock = useCallback(async () => {
    if (!checkWakeLockSupport()) {
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setState(prev => ({ ...prev, wakeLockActive: true }));
      
      // Wake Lock が解除された時の処理
      wakeLockRef.current.addEventListener('release', () => {
        setState(prev => ({ ...prev, wakeLockActive: false }));
      });

      return true;
    } catch (error) {
      console.error('Wake Lock acquisition failed:', error);
      return false;
    }
  }, [checkWakeLockSupport]);

  // Wake Lock の解除
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({ ...prev, wakeLockActive: false }));
      } catch (error) {
        console.error('Wake Lock release failed:', error);
      }
    }
  }, []);

  // ページの可視性監視
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    setState(prev => ({ ...prev, isVisible }));

    if (state.isActive) {
      if (isVisible) {
        // ページが再表示された時にWake Lockを再取得
        acquireWakeLock();
      } else {
        // ページが非表示になった時は一旦Wake Lockを解除
        releaseWakeLock();
      }
    }
  }, [state.isActive, acquireWakeLock, releaseWakeLock]);

  // アクティビティの更新
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setState(prev => ({ ...prev, lastActivity: now }));

    // 一定時間後に非アクティブ状態にする
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      // 30分間アクティビティがない場合は自動停止
      if (state.isActive && Date.now() - now > 30 * 60 * 1000) {
        stopTracking();
      }
    }, 30 * 60 * 1000);
  }, [state.isActive]);

  // バックグラウンド追跡の開始
  const startTracking = useCallback(async () => {
    setState(prev => ({ ...prev, isActive: true }));
    updateActivity();

    // Wake Lock の取得を試行
    if (state.isVisible) {
      await acquireWakeLock();
    }

    // バックグラウンドでの定期的な処理
    const interval = setInterval(() => {
      if (state.isActive) {
        updateActivity();
      }
    }, 60000); // 1分間隔

    return () => {
      clearInterval(interval);
    };
  }, [state.isVisible, state.isActive, acquireWakeLock, updateActivity]);

  // バックグラウンド追跡の停止
  const stopTracking = useCallback(async () => {
    setState(prev => ({ ...prev, isActive: false }));
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }

    await releaseWakeLock();
  }, [releaseWakeLock]);

  // ページの可視性変更の監視
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // 初期化
  useEffect(() => {
    checkWakeLockSupport();
    
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      releaseWakeLock();
    };
  }, [checkWakeLockSupport, releaseWakeLock]);

  // Service Worker の登録（オプション）
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  // バックグラウンド同期の設定（オプション）
  const setupBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // TypeScript型エラー回避のため any を使用
        await (registration as any).sync.register('step-sync');
        console.log('Background sync registered');
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // バッテリー情報の取得（オプション）
  const getBatteryInfo = useCallback(async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      } catch (error) {
        console.error('Battery info not available:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    updateActivity,
    registerServiceWorker,
    setupBackgroundSync,
    getBatteryInfo,
  };
}; 