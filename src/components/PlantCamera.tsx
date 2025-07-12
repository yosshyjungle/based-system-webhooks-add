'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Leaf, Heart, Star, X, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import Image from 'next/image';

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
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    isNewSpecies: boolean;
}

export default function PlantCamera({ userId, onFeedDinosaur }: PlantCameraProps) {
    // 状態管理
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recognizedPlant, setRecognizedPlant] = useState<PlantData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    // Refs
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

    // カメラ起動
    const startCamera = useCallback(async () => {
        try {
            setError(null);
            
            // MediaDevicesサポート確認
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('このブラウザはカメラ機能をサポートしていません。');
                return;
            }

            // カメラストリーム取得
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 }
                }
            });

            setStream(mediaStream);
            setIsCameraOpen(true);

            // ビデオ要素にストリーム設定
            if (videoRef.current) {
                const video = videoRef.current;
                video.srcObject = mediaStream;
                
                // ビデオのプロパティを明示的に設定
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                
                // loadedmetadataイベントで再生を確実に開始
                video.onloadedmetadata = () => {
                    console.log('ビデオメタデータ読み込み完了:', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        readyState: video.readyState
                    });
                    video.play().catch(e => {
                        console.error('ビデオ再生エラー:', e);
                        setError('カメラの映像表示に失敗しました。');
                    });
                };
                
                // エラーイベントのハンドリング
                video.onerror = (e) => {
                    console.error('ビデオエラー:', e);
                    setError('カメラの映像にエラーが発生しました。');
                };
            }

        } catch (err) {
            console.error('カメラ起動エラー:', err);
            setError('カメラの起動に失敗しました。カメラへのアクセス許可を確認してください。');
        }
    }, [facingMode]);

    // facingModeが変更されたときにカメラを再起動
    useEffect(() => {
        if (isCameraOpen) {
            startCamera();
        }
    }, [facingMode, isCameraOpen, startCamera]);

    // カメラ停止
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('カメラトラック停止:', track.kind);
            });
            setStream(null);
        }
        setIsCameraOpen(false);
        if (videoRef.current) {
            const video = videoRef.current;
            video.srcObject = null;
            video.onloadedmetadata = null;
            video.onerror = null;
        }
        setError(null);
    }, [stream]);

    // 写真撮影
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // キャンバスサイズ設定
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 動画フレームをキャンバスに描画
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 画像データURL取得
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageDataUrl);
        setShowResult(false);
        setRecognizedPlant(null);

        // カメラ停止
        stopCamera();
    }, [stopCamera]);

    // カメラ切り替え
    const switchCamera = useCallback(async () => {
        if (isCameraOpen) {
            stopCamera();
            // 少し待ってから新しいfacingModeでカメラを起動
            setTimeout(() => {
                setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
            }, 100);
        } else {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }
    }, [isCameraOpen, stopCamera]);

    // ファイル選択
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

    // 植物認識
    const analyzeImage = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);

        // AI認識をシミュレート
        setTimeout(() => {
            const randomPlant = mockPlants[Math.floor(Math.random() * mockPlants.length)];
            setRecognizedPlant(randomPlant);
            setIsAnalyzing(false);
            setShowResult(true);

            // 図鑑に追加
            savePlantToEncyclopedia(randomPlant);
        }, 2000);
    };

    // 図鑑への保存
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
            console.error('図鑑保存エラー:', error);
        }
    };

    // 恐竜に餌やり
    const feedToDinosaur = () => {
        if (recognizedPlant && recognizedPlant.isEdible) {
            onFeedDinosaur(recognizedPlant.nutritionValue);
            resetAll();
        }
    };

    // リセット
    const resetAll = () => {
        setSelectedImage(null);
        setRecognizedPlant(null);
        setShowResult(false);
        setError(null);
        if (isCameraOpen) {
            stopCamera();
        }
    };

    // レア度の色取得
    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-600';
            case 'uncommon': return 'text-blue-600';
            case 'rare': return 'text-purple-600';
            case 'legendary': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    // レア度の背景色取得
    const getRarityBackground = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'bg-gray-50 border-gray-200';
            case 'uncommon': return 'bg-blue-50 border-blue-200';
            case 'rare': return 'bg-purple-50 border-purple-200';
            case 'legendary': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">草花カメラ</h2>

            {/* エラー表示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <X className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* カメラビュー */}
            {isCameraOpen && (
                <div className="space-y-4 mb-6">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay={true}
                            playsInline={true}
                            muted={true}
                            controls={false}
                            className="w-full h-64 object-cover"
                            style={{ 
                                backgroundColor: '#000',
                                minHeight: '256px',
                                maxHeight: '256px'
                            }}
                        />
                        
                        {/* 現在のカメラ表示 */}
                        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                            {facingMode === 'environment' ? (
                                <>
                                    <Monitor className="w-4 h-4" />
                                    <span>リアカメラ</span>
                                </>
                            ) : (
                                <>
                                    <Smartphone className="w-4 h-4" />
                                    <span>フロントカメラ</span>
                                </>
                            )}
                        </div>
                        
                        {/* カメラコントロール */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                            {/* カメラ切り替えボタン */}
                            <button
                                onClick={switchCamera}
                                className="bg-blue-500 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-full transition-all shadow-lg flex items-center space-x-2"
                                title={`${facingMode === 'environment' ? 'フロント' : 'リア'}カメラに切り替え`}
                            >
                                {facingMode === 'environment' ? (
                                    <>
                                        <Smartphone className="w-5 h-5" />
                                        <span className="text-sm font-medium">フロント</span>
                                    </>
                                ) : (
                                    <>
                                        <Monitor className="w-5 h-5" />
                                        <span className="text-sm font-medium">リア</span>
                                    </>
                                )}
                            </button>

                            {/* 撮影ボタン */}
                            <button
                                onClick={capturePhoto}
                                className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full transition-all shadow-lg"
                                title="写真を撮影"
                            >
                                <Camera className="w-8 h-8" />
                            </button>

                            {/* 閉じるボタン */}
                            <button
                                onClick={stopCamera}
                                className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-3 rounded-full transition-all"
                                title="カメラを閉じる"
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

            {/* 撮影・アップロード画面 */}
            {!isCameraOpen && !selectedImage && (
                <div className="space-y-6">
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-2">💡 使い方</h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• カメラボタンで直接撮影できます</li>
                            <li>• 写真選択でギャラリーから選べます</li>
                            <li>• 🔄 青いボタンでフロント/リアカメラを切り替え</li>
                            <li>• AI が自動で植物を認識します</li>
                            <li>• 食べられる草花は恐竜のエサになります</li>
                            <li>• 新種発見でボーナスコインがもらえます</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* 撮影した画像の表示・認識 */}
            {!isCameraOpen && selectedImage && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-4 shadow-md">
                        <div className="relative w-full h-64 mb-4">
                            <Image
                                src={selectedImage}
                                alt="選択された植物"
                                fill
                                className="object-cover rounded-lg"
                            />
                        </div>

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
                        <div className={`rounded-lg p-6 shadow-md border-2 ${getRarityBackground(recognizedPlant.rarity)}`}>
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

                            <div className="text-center mb-4">
                                {recognizedPlant.isEdible ? (
                                    <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                                        <Heart className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <p className="text-green-800 font-medium">食べられます</p>
                                        <p className="text-green-600 text-sm">栄養価: {recognizedPlant.nutritionValue}</p>
                                    </div>
                                ) : (
                                    <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                                        <X className="w-6 h-6 text-red-600 mx-auto mb-1" />
                                        <p className="text-red-800 font-medium">食べられません</p>
                                        <p className="text-red-600 text-sm">恐竜には与えられません</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {recognizedPlant.isEdible && (
                                    <button
                                        onClick={feedToDinosaur}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Heart className="w-5 h-5 mr-2" />
                                        恐竜に与える
                                    </button>
                                )}

                                <button
                                    onClick={resetAll}
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
                                >
                                    新しい植物を撮影
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 隠しキャンバス（写真撮影用） */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
} 