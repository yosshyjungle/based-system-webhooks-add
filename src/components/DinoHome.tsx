'use client';

import { useState, useEffect } from 'react';
import {
    Heart,
    Footprints,
    Camera,
    Book,
    Settings,
    Coins,
    TrendingUp,
    MapPin
} from 'lucide-react';
// import DinosaurDisplay from './DinosaurDisplay';
import WalkingCounter from './WalkingCounter';
import PlantCamera from './PlantCamera';
// import Encyclopedia from './Encyclopedia';

interface DinoHomeProps {
    userId: string;
}

interface DinosaurData {
    id: string;
    name: string;
    level: number;
    experience: number;
    hunger: number;
    species: string;
    appearanceState: string;
    lastFed: Date;
}

interface UserData {
    totalSteps: number;
    coins: number;
    nickname?: string;
}

export default function DinoHome({ userId }: DinoHomeProps) {
    const [activeTab, setActiveTab] = useState('home');
    const [dinosaur, setDinosaur] = useState<DinosaurData | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            // ユーザーデータの取得
            const userResponse = await fetch(`/api/user/${userId}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
            }

            // 恐竜データの取得
            const dinoResponse = await fetch(`/api/dinosaur/${userId}`);
            if (dinoResponse.ok) {
                const dinoData = await dinoResponse.json();
                setDinosaur(dinoData);
            } else {
                // 恐竜がいない場合は作成
                const createResponse = await fetch('/api/dinosaur/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                if (createResponse.ok) {
                    const newDino = await createResponse.json();
                    setDinosaur(newDino);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStepsUpdate = (steps: number) => {
        if (user) {
            setUser({ ...user, totalSteps: steps });
            // 恐竜の経験値も更新
            if (dinosaur) {
                const addedSteps = Math.max(0, steps - user.totalSteps);
                const newExp = dinosaur.experience + addedSteps;
                const newLevel = Math.floor(newExp / 100) + 1;
                setDinosaur({
                    ...dinosaur,
                    experience: newExp,
                    level: newLevel,
                    appearanceState: newLevel > 10 ? "adult" : newLevel > 5 ? "child" : "baby"
                });
            }
        }
    };

    const handleFeedDinosaur = async (nutritionValue: number) => {
        if (!dinosaur) return;

        try {
            const response = await fetch('/api/dinosaur/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, nutritionValue })
            });

            if (response.ok) {
                const newHunger = Math.min(100, dinosaur.hunger + nutritionValue);
                setDinosaur({ ...dinosaur, hunger: newHunger, lastFed: new Date() });
            }
        } catch (error) {
            console.error('Error feeding dinosaur:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-green-800">恐竜を呼び出し中...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'walking':
                return <WalkingCounter userId={userId} onStepsUpdate={handleStepsUpdate} />;
            case 'camera':
                return <PlantCamera userId={userId} onFeedDinosaur={handleFeedDinosaur} />;
            case 'encyclopedia':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-green-800 mb-4">図鑑</h2>
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <p className="text-gray-600">図鑑機能（開発予定）</p>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-green-800 mb-4">設定</h2>
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <p className="text-gray-600">設定画面（開発予定）</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-6">
                        {/* ステータス表示 */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 shadow-md text-center">
                                <Footprints className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                <div className="text-lg font-bold text-gray-800">{user?.totalSteps || 0}</div>
                                <div className="text-sm text-gray-600">歩数</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-md text-center">
                                <Coins className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                                <div className="text-lg font-bold text-gray-800">{user?.coins || 0}</div>
                                <div className="text-sm text-gray-600">コイン</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-md text-center">
                                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <div className="text-lg font-bold text-gray-800">Lv.{dinosaur?.level || 1}</div>
                                <div className="text-sm text-gray-600">恐竜レベル</div>
                            </div>
                        </div>

                        {/* 恐竜表示エリア */}
                        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                            <div className="text-center">
                                <div className="text-8xl mb-4 animate-bounce">
                                    {dinosaur ? '🦕' : '🥚'}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                    {dinosaur?.name || 'マイ恐竜'}
                                </h3>
                                <p className="text-gray-600 text-sm">{dinosaur?.species || 'トリケラトプス'}</p>
                            </div>
                        </div>

                        {/* 空腹度表示 */}
                        {dinosaur && (
                            <div className="bg-white rounded-lg p-4 shadow-md mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <Heart className="w-5 h-5 text-red-500 mr-2" />
                                        <span className="font-medium">空腹度</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{dinosaur.hunger}/100</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${dinosaur.hunger > 70 ? 'bg-green-500' :
                                            dinosaur.hunger > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${dinosaur.hunger}%` }}
                                    ></div>
                                </div>
                                {dinosaur.hunger < 30 && (
                                    <p className="text-red-600 text-sm mt-2">恐竜がお腹を空かせています！草花を見つけてエサをあげましょう。</p>
                                )}
                            </div>
                        )}

                        {/* クイックアクション */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('walking')}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <MapPin className="w-5 h-5 mr-2" />
                                散歩に行く
                            </button>
                            <button
                                onClick={() => setActiveTab('camera')}
                                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                草花を撮影
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white min-h-screen">
            {/* コンテンツエリア */}
            <div className="pb-20">
                {renderContent()}
            </div>

            {/* ボトムナビゲーション */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                <div className="max-w-md mx-auto flex">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 p-4 text-center ${activeTab === 'home' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Heart className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">ホーム</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('walking')}
                        className={`flex-1 p-4 text-center ${activeTab === 'walking' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Footprints className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">散歩</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('camera')}
                        className={`flex-1 p-4 text-center ${activeTab === 'camera' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">撮影</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('encyclopedia')}
                        className={`flex-1 p-4 text-center ${activeTab === 'encyclopedia' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Book className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">図鑑</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 p-4 text-center ${activeTab === 'settings' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Settings className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">設定</span>
                    </button>
                </div>
            </div>
        </div>
    );
} 