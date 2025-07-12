import { useState, useEffect, useCallback } from 'react';

interface AccelerometerState {
  x: number | null;
  y: number | null;
  z: number | null;
  timestamp: number | null;
  error: string | null;
  isSupported: boolean;
  isListening: boolean;
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export const useAccelerometer = () => {
  const [state, setState] = useState<AccelerometerState>({
    x: null,
    y: null,
    z: null,
    timestamp: null,
    error: null,
    isSupported: false,
    isListening: false,
  });

  const [listeners, setListeners] = useState<((data: AccelerometerData) => void)[]>([]);

  const checkSupport = useCallback(() => {
    const supported = 'DeviceMotionEvent' in window;
    setState(prev => ({ ...prev, isSupported: supported }));
    
    if (!supported) {
      setState(prev => ({
        ...prev,
        error: 'Device motion is not supported by this browser.',
      }));
    }
    
    return supported;
  }, []);

  const requestPermission = useCallback(async () => {
    if (!checkSupport()) {
      return false;
    }

    try {
      // iOS 13+ requires permission
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          setState(prev => ({
            ...prev,
            error: 'Permission denied for device motion.',
          }));
          return false;
        }
      }
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Permission request failed: ${error}`,
      }));
      return false;
    }
  }, [checkSupport]);

  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (acceleration && acceleration.x !== null && acceleration.y !== null && acceleration.z !== null) {
      const data: AccelerometerData = {
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z,
        timestamp: data.timestamp,
        error: null,
      }));

      // Notify all listeners
      listeners.forEach(listener => listener(data));
    }
  }, [listeners]);

  const startListening = useCallback(async () => {
    if (state.isListening) {
      return true;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }

    try {
      window.addEventListener('devicemotion', handleDeviceMotion);
      setState(prev => ({ ...prev, isListening: true, error: null }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to start listening: ${error}`,
      }));
      return false;
    }
  }, [state.isListening, requestPermission, handleDeviceMotion]);

  const stopListening = useCallback(() => {
    if (!state.isListening) {
      return;
    }

    window.removeEventListener('devicemotion', handleDeviceMotion);
    setState(prev => ({ ...prev, isListening: false }));
  }, [state.isListening, handleDeviceMotion]);

  const addListener = useCallback((listener: (data: AccelerometerData) => void) => {
    setListeners(prev => [...prev, listener]);
    return () => {
      setListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  useEffect(() => {
    checkSupport();
    
    return () => {
      if (state.isListening) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [checkSupport, state.isListening, handleDeviceMotion]);

  return {
    ...state,
    startListening,
    stopListening,
    addListener,
    requestPermission,
  };
}; 