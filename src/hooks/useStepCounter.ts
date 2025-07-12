import { useState, useCallback, useRef } from 'react';

interface StepCounterState {
  steps: number;
  isActive: boolean;
  sensitivity: number;
  lastStepTime: number | null;
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export const useStepCounter = (initialSensitivity: number = 10) => {
  const [state, setState] = useState<StepCounterState>({
    steps: 0,
    isActive: false,
    sensitivity: initialSensitivity,
    lastStepTime: null,
  });

  // 加速度データの履歴を保持
  const accelerationHistory = useRef<AccelerometerData[]>([]);
  const lastPeakTime = useRef<number>(0);
  const isStepDetected = useRef<boolean>(false);

  // 移動平均を計算するための窓サイズ
  const WINDOW_SIZE = 10;
  // 歩数検出の最小間隔（ミリ秒）
  const MIN_STEP_INTERVAL = 300;
  // 歩数検出の最大間隔（ミリ秒）
  const MAX_STEP_INTERVAL = 2000;

  // 3軸の合成加速度を計算
  const calculateMagnitude = useCallback((data: AccelerometerData) => {
    return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
  }, []);

  // 移動平均を計算
  const calculateMovingAverage = useCallback((history: AccelerometerData[]) => {
    if (history.length === 0) return 0;
    
    const sum = history.reduce((acc, data) => acc + calculateMagnitude(data), 0);
    return sum / history.length;
  }, [calculateMagnitude]);

  // ピーク検出アルゴリズム
  const detectPeak = useCallback((currentMagnitude: number, average: number, timestamp: number) => {
    const threshold = state.sensitivity;
    const timeSinceLastPeak = timestamp - lastPeakTime.current;
    
    // 閾値を超えているかチェック
    const isAboveThreshold = currentMagnitude > (average + threshold);
    
    // 最小間隔をチェック
    const isValidInterval = timeSinceLastPeak > MIN_STEP_INTERVAL;
    
    // 最大間隔をチェック（長時間歩数がない場合はリセット）
    if (timeSinceLastPeak > MAX_STEP_INTERVAL) {
      isStepDetected.current = false;
    }
    
    // ピーク検出ロジック
    if (isAboveThreshold && isValidInterval && !isStepDetected.current) {
      isStepDetected.current = true;
      lastPeakTime.current = timestamp;
      return true;
    }
    
    // 閾値を下回った場合、次のピーク検出を有効にする
    if (currentMagnitude < (average - threshold / 2)) {
      isStepDetected.current = false;
    }
    
    return false;
  }, [state.sensitivity]);

  // 加速度データを処理して歩数を検出
  const processAccelerometerData = useCallback((data: AccelerometerData) => {
    if (!state.isActive) return;

    // 履歴に追加
    accelerationHistory.current.push(data);
    
    // 窓サイズを超えた場合、古いデータを削除
    if (accelerationHistory.current.length > WINDOW_SIZE) {
      accelerationHistory.current.shift();
    }

    // 十分なデータが蓄積されてから処理開始
    if (accelerationHistory.current.length < WINDOW_SIZE) return;

    const currentMagnitude = calculateMagnitude(data);
    const average = calculateMovingAverage(accelerationHistory.current);

    // ピーク検出
    if (detectPeak(currentMagnitude, average, data.timestamp)) {
      setState(prev => ({
        ...prev,
        steps: prev.steps + 1,
        lastStepTime: data.timestamp,
      }));
    }
  }, [state.isActive, calculateMagnitude, calculateMovingAverage, detectPeak]);

  // 歩数カウントを開始
  const startCounting = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    accelerationHistory.current = [];
    lastPeakTime.current = 0;
    isStepDetected.current = false;
  }, []);

  // 歩数カウントを停止
  const stopCounting = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  // 歩数をリセット
  const resetSteps = useCallback(() => {
    setState(prev => ({
      ...prev,
      steps: 0,
      lastStepTime: null,
    }));
    accelerationHistory.current = [];
    lastPeakTime.current = 0;
    isStepDetected.current = false;
  }, []);

  // 感度を調整
  const setSensitivity = useCallback((sensitivity: number) => {
    setState(prev => ({ ...prev, sensitivity }));
  }, []);

  // 手動で歩数を追加（デバッグ用）
  const addSteps = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps + count,
      lastStepTime: Date.now(),
    }));
  }, []);

  return {
    ...state,
    startCounting,
    stopCounting,
    resetSteps,
    setSensitivity,
    addSteps,
    processAccelerometerData,
  };
}; 