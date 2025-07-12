'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Footprints, Award, MapPin, Zap } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAccelerometer } from '../hooks/useAccelerometer';
import { useStepCounter } from '../hooks/useStepCounter';
import { useBackgroundTracking } from '../hooks/useBackgroundTracking';
import { calculateTotalDistance, formatDistance, formatSpeed, isAccuratePosition, Position } from '../utils/geoUtils';

interface WalkingCounterProps {
    userId: string;
    onStepsUpdate: (steps: number) => void;
}

export default function WalkingCounter({ userId, onStepsUpdate }: WalkingCounterProps) {
    const [steps, setSteps] = useState(0);
    const [isWalking, setIsWalking] = useState(false);
    const [sessionSteps, setSessionSteps] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [positionHistory, setPositionHistory] = useState<Position[]>([]);
    const [sessionDistance, setSessionDistance] = useState(0);
    const [useRealSensors, setUseRealSensors] = useState(false);
    const [sensorPermissions, setSensorPermissions] = useState({
        location: false,
        motion: false,
    });

    // センサーフックの初期化
    const geolocation = useGeolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
    });

    const accelerometer = useAccelerometer();
    const stepCounter = useStepCounter(12); // 感度設定
    const backgroundTracking = useBackgroundTracking();

    const loadSteps = useCallback(async () => {
        try {
            const response = await fetch(`/api/user/${userId}/steps`);
            if (response.ok) {
                const data = await response.json();
                const totalSteps = data.totalSteps || 0;
                setSteps(totalSteps);
                // 初期値の設定も遅延実行
                setTimeout(() => {
                    onStepsUpdate(totalSteps);
                }, 0);
            }
        } catch (error) {
            console.error('Error loading steps:', error);
        }
    }, [userId, onStepsUpdate]);

    useEffect(() => {
        loadSteps();
    }, [loadSteps]);

    // 位置情報の監視
    useEffect(() => {
        if (geolocation.latitude && geolocation.longitude && geolocation.accuracy) {
            if (isAccuratePosition(geolocation.accuracy)) {
                const newPosition: Position = {
                    latitude: geolocation.latitude,
                    longitude: geolocation.longitude,
                    timestamp: geolocation.timestamp || Date.now(),
                };

                setPositionHistory(prev => {
                    const updated = [...prev, newPosition];
                    // 最新の100件のみ保持
                    if (updated.length > 100) {
                        updated.shift();
                    }
                    
                    // セッション距離を更新
                    if (isWalking && updated.length >= 2) {
                        const totalDistance = calculateTotalDistance(updated);
                        setSessionDistance(totalDistance);
                    }
                    
                    return updated;
                });
            }
        }
    }, [geolocation.latitude, geolocation.longitude, geolocation.accuracy, geolocation.timestamp, isWalking]);

    // 加速度センサーのデータ処理
    useEffect(() => {
        if (useRealSensors && accelerometer.isListening && accelerometer.x !== null && accelerometer.y !== null && accelerometer.z !== null) {
            const accelerometerData = {
                x: accelerometer.x,
                y: accelerometer.y,
                z: accelerometer.z,
                timestamp: accelerometer.timestamp || Date.now(),
            };
            
            stepCounter.processAccelerometerData(accelerometerData);
        }
    }, [accelerometer.x, accelerometer.y, accelerometer.z, accelerometer.timestamp, useRealSensors, accelerometer.isListening, stepCounter]);

    // 歩数カウンターの歩数を監視
    useEffect(() => {
        if (useRealSensors && stepCounter.steps > sessionSteps) {
            const newSteps = stepCounter.steps - sessionSteps;
            setSteps(prev => {
                const totalSteps = prev + newSteps;
                setTimeout(() => {
                    onStepsUpdate(totalSteps);
                }, 0);
                return totalSteps;
            });
            setSessionSteps(stepCounter.steps);
        }
    }, [stepCounter.steps, sessionSteps, useRealSensors, onStepsUpdate]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isWalking) {
            interval = setInterval(() => {
                // ウォーキングシミュレーション（1秒に1-3歩）
                const randomSteps = Math.floor(Math.random() * 3) + 1;
                setSteps(prev => {
                    const newSteps = prev + randomSteps;
                    setSessionSteps(prevSession => prevSession + randomSteps);
                    // 状態更新を遅延実行
                    setTimeout(() => {
                        onStepsUpdate(newSteps);
                    }, 0);
                    return newSteps;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isWalking, onStepsUpdate]);



    // センサー許可の確認
    const checkSensorPermissions = useCallback(async () => {
        const locationPermission = await geolocation.getCurrentPosition();
        const motionPermission = await accelerometer.requestPermission();
        
        setSensorPermissions({
            location: !geolocation.error,
            motion: motionPermission,
        });
        
        return !geolocation.error && motionPermission;
    }, [geolocation, accelerometer]);

    const startWalking = async () => {
        setIsWalking(true);
        setSessionStartTime(new Date());
        setSessionDistance(0);
        setPositionHistory([]);
        
        if (useRealSensors) {
            // センサー許可の確認
            const hasPermissions = await checkSensorPermissions();
            
            if (hasPermissions) {
                // GPS監視開始
                geolocation.startWatching();
                
                // 加速度センサー開始
                await accelerometer.startListening();
                
                // 歩数カウント開始
                stepCounter.startCounting();
                stepCounter.resetSteps();

                // バックグラウンド追跡開始
                backgroundTracking.startTracking();
            } else {
                alert('センサーの許可が必要です。設定を確認してください。');
                setIsWalking(false);
                return;
            }
        }
    };

    const stopWalking = async () => {
        setIsWalking(false);
        
        if (useRealSensors) {
            // センサー停止
            geolocation.stopWatching();
            accelerometer.stopListening();
            stepCounter.stopCounting();

            // バックグラウンド追跡停止
            backgroundTracking.stopTracking();
        }
        
        // サーバーに歩数を保存
        try {
            await fetch('/api/user/steps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, steps })
            });
        } catch (error) {
            console.error('Error saving steps:', error);
        }
    };

    const resetSession = () => {
        setSessionSteps(0);
        setSessionStartTime(null);
        setSessionDistance(0);
        setPositionHistory([]);
        setIsWalking(false);
        
        if (useRealSensors) {
            stepCounter.resetSteps();
        }
    };

    const addManualSteps = (amount: number) => {
        if (useRealSensors) {
            // リアルセンサー使用時は手動追加を無効化
            return;
        }
        
        const newSteps = steps + amount;
        setSteps(newSteps);
        setSessionSteps(prev => prev + amount);
        // 手動追加の場合も遅延実行
        setTimeout(() => {
            onStepsUpdate(newSteps);
        }, 0);
    };

    const formatTime = (start: Date) => {
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getSessionExperience = () => {
        return sessionSteps; // 1歩 = 1経験値
    };

    const getCurrentSpeed = () => {
        if (positionHistory.length < 2) return 0;
        
        const recent = positionHistory.slice(-2);
        const distance = calculateTotalDistance(recent);
        const timeDiff = (recent[1].timestamp! - recent[0].timestamp!) / 1000;
        
        return timeDiff > 0 ? distance / timeDiff : 0;
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">散歩モード</h2>
            
            {/* センサー切り替え */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                        実際のセンサーを使用
                    </label>
                    <button
                        onClick={() => setUseRealSensors(!useRealSensors)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            useRealSensors ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                useRealSensors ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                
                {useRealSensors && (
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            GPS: {sensorPermissions.location ? '✓ 許可済み' : '✗ 未許可'}
                        </div>
                        <div className="flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            加速度: {sensorPermissions.motion ? '✓ 許可済み' : '✗ 未許可'}
                        </div>
                    </div>
                )}
            </div>

            {/* 恐竜のアニメーション */}
            <div className="text-center mb-8">
                <div className={`text-6xl ${isWalking ? 'animate-bounce' : ''}`}>
                    🦕
                </div>
                <p className="text-gray-600 mt-2">
                    {isWalking ? '一緒に歩いています！' : '散歩の準備はできています'}
                </p>
            </div>

            {/* 歩数表示 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                    <Footprints className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{steps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">総歩数</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{sessionSteps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">今回の歩数</div>
                </div>
            </div>

            {/* GPS情報表示 */}
            {useRealSensors && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-md text-center">
                        <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-800">{formatDistance(sessionDistance)}</div>
                        <div className="text-sm text-gray-600">移動距離</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md text-center">
                        <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-800">{formatSpeed(getCurrentSpeed())}</div>
                        <div className="text-sm text-gray-600">現在の速度</div>
                    </div>
                </div>
            )}

            {/* セッション情報 */}
            {sessionStartTime && (
                <div className="bg-white rounded-lg p-4 shadow-md mb-6">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-800">散歩時間</div>
                        <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStartTime)}</div>
                        <div className="text-sm text-gray-600 mt-2">
                            獲得経験値: {getSessionExperience()} EXP
                        </div>
                    </div>
                </div>
            )}

            {/* コントロールボタン */}
            <div className="space-y-4">
                <div className="flex gap-4">
                    {!isWalking ? (
                        <button
                            onClick={startWalking}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            散歩開始
                        </button>
                    ) : (
                        <button
                            onClick={stopWalking}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Pause className="w-5 h-5 mr-2" />
                            散歩終了
                        </button>
                    )}

                    <button
                        onClick={resetSession}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* 手動歩数追加ボタン（デモ用） */}
                {!useRealSensors && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-2">クイック追加（デモ用）</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => addManualSteps(100)}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm"
                            >
                                +100歩
                            </button>
                            <button
                                onClick={() => addManualSteps(500)}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm"
                            >
                                +500歩
                            </button>
                            <button
                                onClick={() => addManualSteps(1000)}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm"
                            >
                                +1000歩
                            </button>
                        </div>
                    </div>
                )}

                {/* センサー情報表示 */}
                {useRealSensors && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">センサー情報</h3>
                        <div className="text-xs text-blue-700 space-y-1">
                            <div>GPS精度: {geolocation.accuracy ? `${Math.round(geolocation.accuracy)}m` : '取得中...'}</div>
                            <div>加速度: {accelerometer.isListening ? '監視中' : '停止中'}</div>
                            <div>検出感度: {stepCounter.sensitivity}</div>
                            <div>バックグラウンド: {backgroundTracking.isActive ? '有効' : '無効'}</div>
                            <div>Wake Lock: {backgroundTracking.wakeLockActive ? '有効' : '無効'}</div>
                            {geolocation.error && <div className="text-red-600">GPS エラー: {geolocation.error}</div>}
                            {accelerometer.error && <div className="text-red-600">加速度 エラー: {accelerometer.error}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 