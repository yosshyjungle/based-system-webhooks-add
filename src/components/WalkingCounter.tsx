'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Footprints, Award } from 'lucide-react';

interface WalkingCounterProps {
    userId: string;
    onStepsUpdate: (steps: number) => void;
}

export default function WalkingCounter({ userId, onStepsUpdate }: WalkingCounterProps) {
    const [steps, setSteps] = useState(0);
    const [isWalking, setIsWalking] = useState(false);
    const [sessionSteps, setSessionSteps] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

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



    const startWalking = () => {
        setIsWalking(true);
        setSessionStartTime(new Date());
    };

    const stopWalking = async () => {
        setIsWalking(false);
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
        setIsWalking(false);
    };

    const addManualSteps = (amount: number) => {
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

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">散歩モード</h2>

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
            </div>
        </div>
    );
} 