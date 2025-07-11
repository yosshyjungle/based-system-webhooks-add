'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Leaf, Heart, Star, X, RotateCcw } from 'lucide-react';

interface PlantCameraProps {
    userId: string;
    onFeedDinosaur: (nutritionValue: number) => void;
}

interface PlantData {
    id: string;
    name: string;
    scientificName?: string;
    isEdible: boolean;
    nutritionValue: number;
    rarity: string;
    isNewSpecies: boolean;
}

export default function PlantCamera({ userId, onFeedDinosaur }: PlantCameraProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recognizedPlant, setRecognizedPlant] = useState<PlantData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mock植物データベース
    const mockPlants: PlantData[] = [
        {
            id: '1',
            name: 'タンポポ',
            scientificName: 'Taraxacum officinale',
            isEdible: true,
            nutritionValue: 15,
            rarity: 'common',
            isNewSpecies: false
        },
        {
            id: '2',
            name: 'クローバー',
            scientificName: 'Trifolium repens',
            isEdible: true,
            nutritionValue: 10,
            rarity: 'common',
            isNewSpecies: false
        },
        {
            id: '3',
            name: 'イチゴの葉',
            scientificName: 'Fragaria × ananassa',
            isEdible: true,
            nutritionValue: 25,
            rarity: 'uncommon',
            isNewSpecies: false
        },
        {
            id: '4',
            name: 'レアプラント',
            scientificName: 'Plantae rara',
            isEdible: true,
            nutritionValue: 50,
            rarity: 'rare',
            isNewSpecies: true
        },
        {
            id: '5',
            name: '毒草',
            scientificName: 'Toxicus plantae',
            isEdible: false,
            nutritionValue: 0,
            rarity: 'common',
            isNewSpecies: false
        }
    ];

    // カメラストリームの開始
    const startCamera = useCallback(async () => {
        try {
            setError(null);

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsCameraOpen(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('カメラアクセスエラー:', err);
            setError('カメラにアクセスできませんでした。ブラウザの設定を確認してください。');
        }
    }, [facingMode]);

    // カメラストリームの停止
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    // 写真を撮影
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // キャンバスサイズを動画サイズに合わせる
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 動画フレームをキャンバスに描画
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // キャンバスからデータURLを取得
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageDataUrl);
        setShowResult(false);
        setRecognizedPlant(null);

        // カメラを停止
        stopCamera();
    }, [stopCamera]);

    // カメラの向きを切り替え
    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        if (isCameraOpen) {
            stopCamera();
            // 少し待ってから新しい向きでカメラを開始
            setTimeout(startCamera, 100);
        }
    }, [isCameraOpen, stopCamera, startCamera]);

    // コンポーネントのクリーンアップ
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string);
                setShowResult(false);
                setRecognizedPlant(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);

        // AI認識をシミュレート（実際のMVPでは実際のAI APIを使用）
        setTimeout(() => {
            // ランダムに植物を選択
            const randomPlant = mockPlants[Math.floor(Math.random() * mockPlants.length)];
            setRecognizedPlant(randomPlant);
            setIsAnalyzing(false);
            setShowResult(true);

            // 図鑑に追加（APIコール）
            savePlantToEncyclopedia(randomPlant);
        }, 2000);
    };

    const savePlantToEncyclopedia = async (plant: PlantData) => {
        try {
            await fetch('/api/plants/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    plantData: plant,
                    imageUrl: selectedImage
                })
            });
        } catch (error) {
            console.error('Error saving plant:', error);
        }
    };

    const feedToDinosaur = () => {
        if (recognizedPlant && recognizedPlant.isEdible) {
            onFeedDinosaur(recognizedPlant.nutritionValue);
            setSelectedImage(null);
            setRecognizedPlant(null);
            setShowResult(false);
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-600';
            case 'uncommon': return 'text-green-600';
            case 'rare': return 'text-blue-600';
            case 'legendary': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    const getRarityBackground = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'bg-gray-100';
            case 'uncommon': return 'bg-green-100';
            case 'rare': return 'bg-blue-100';
            case 'legendary': return 'bg-purple-100';
            default: return 'bg-gray-100';
        }
    };

    const resetAll = () => {
        setSelectedImage(null);
        setRecognizedPlant(null);
        setShowResult(false);
        setError(null);
        if (isCameraOpen) {
            stopCamera();
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">草花カメラ</h2>

            {/* エラー表示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* カメラビュー */}
            {isCameraOpen && (
                <div className="space-y-4 mb-6">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 object-cover"
                        />

                        {/* カメラコントロール */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                            <button
                                onClick={switchCamera}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>

                            <button
                                onClick={capturePhoto}
                                className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full transition-all shadow-lg"
                            >
                                <Camera className="w-8 h-8" />
                            </button>

                            <button
                                onClick={stopCamera}
                                className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-3 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-gray-600 text-sm">
                        草花にカメラを向けて、中央のボタンで撮影してください
                    </p>
                </div>
            )}

            {/* 撮影した画像またはアップロード画面 */}
            {!isCameraOpen && !selectedImage && (
                <div className="space-y-6">
                    {/* カメラ表示エリア */}
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">草花を撮影して恐竜にエサをあげましょう！</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        <div className="space-y-3">
                            <button
                                onClick={startCamera}
                                className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                カメラで撮影
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                写真を選択
                            </button>
                        </div>
                    </div>

                    {/* 使い方ガイド */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-2">💡 使い方</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• カメラボタンで直接撮影できます</li>
                            <li>• フロント/リアカメラの切り替え可能</li>
                            <li>• AI が自動で植物を認識</li>
                            <li>• 食べられる草花は恐竜のエサに</li>
                            <li>• 新種発見でボーナス！</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* 選択された画像の表示と認識 */}
            {!isCameraOpen && selectedImage && (
                <div className="space-y-6">
                    {/* 選択された画像 */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <img
                            src={selectedImage}
                            alt="選択された植物"
                            className="w-full h-64 object-cover rounded-lg mb-4"
                        />

                        {!showResult && !isAnalyzing && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={analyzeImage}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <Leaf className="w-5 h-5 mr-2" />
                                    植物を認識する
                                </button>
                                <button
                                    onClick={resetAll}
                                    className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 解析中 */}
                    {isAnalyzing && (
                        <div className="bg-white rounded-lg p-6 shadow-md text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">AI が植物を認識中...</p>
                        </div>
                    )}

                    {/* 認識結果 */}
                    {showResult && recognizedPlant && (
                        <div className={`rounded-lg p-6 shadow-md ${getRarityBackground(recognizedPlant.rarity)}`}>
                            <div className="text-center mb-4">
                                {recognizedPlant.isNewSpecies && (
                                    <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold mb-2 inline-block">
                                        <Star className="w-4 h-4 inline mr-1" />
                                        新種発見！
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-800">{recognizedPlant.name}</h3>
                                {recognizedPlant.scientificName && (
                                    <p className="text-sm text-gray-600 italic">{recognizedPlant.scientificName}</p>
                                )}
                                <p className={`text-sm font-medium ${getRarityColor(recognizedPlant.rarity)}`}>
                                    {recognizedPlant.rarity === 'common' ? '一般的' :
                                        recognizedPlant.rarity === 'uncommon' ? '珍しい' :
                                            recognizedPlant.rarity === 'rare' ? 'レア' : '伝説'}
                                </p>
                            </div>

                            {recognizedPlant.isEdible ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <Heart className="w-5 h-5 text-green-600 mr-2" />
                                            <span className="font-medium text-green-800">食用可能</span>
                                        </div>
                                        <p className="text-green-700 text-sm">
                                            栄養価: {recognizedPlant.nutritionValue} ポイント
                                        </p>
                                    </div>

                                    <button
                                        onClick={feedToDinosaur}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Heart className="w-5 h-5 mr-2" />
                                        恐竜にエサをあげる
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <span className="font-medium text-red-800">⚠️ 毒草です</span>
                                    </div>
                                    <p className="text-red-700 text-sm">
                                        この植物は恐竜には与えられません。図鑑には記録されました。
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={resetAll}
                                className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
                            >
                                新しい植物を撮影
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 隠しキャンバス（写真撮影用） */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
} 