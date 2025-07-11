'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Leaf, Heart, Star, X, RotateCcw, Smartphone, Monitor } from 'lucide-react';

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

// デバイスタイプを判定するユーティリティ関数
const detectDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
        isMobile: isMobile && !isTablet,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        isTouchDevice,
        platform: {
            isIOS: /iphone|ipad|ipod/i.test(userAgent),
            isAndroid: /android/i.test(userAgent),
            isWindows: /windows/i.test(userAgent),
            isMac: /mac/i.test(userAgent)
        }
    };
};

export default function PlantCamera({ userId, onFeedDinosaur }: PlantCameraProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recognizedPlant, setRecognizedPlant] = useState<PlantData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof detectDeviceType> | null>(null);
    const [videoDebugInfo, setVideoDebugInfo] = useState<{
        readyState: number;
        networkState: number;
        currentTime: number;
        duration: number;
        videoWidth: number;
        videoHeight: number;
        paused: boolean;
        ended: boolean;
    } | null>(null);
    const [streamMonitorId, setStreamMonitorId] = useState<NodeJS.Timeout | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoEventListenersRef = useRef<(() => void)[]>([]);

    // 使用可能なカメラデバイスを取得
    const getAvailableCameras = useCallback(async () => {
        // deviceInfoがまだ設定されていない場合は何もしない
        if (!deviceInfo) return;

        try {
            // MediaDevicesがサポートされているかチェック
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('このブラウザはカメラ機能をサポートしていません。');
                return;
            }

            // まず権限を要求（短時間のストリームを作成して権限を取得）
            let tempStream: MediaStream | null = null;
            try {
                // デバイスタイプに応じた初期制約
                const initialConstraints = deviceInfo.isMobile ? 
                    { video: { facingMode: 'environment' } } : 
                    { video: true };
                    
                tempStream = await navigator.mediaDevices.getUserMedia(initialConstraints);
                tempStream.getTracks().forEach(track => track.stop()); // すぐに停止
            } catch (permissionError) {
                console.warn('カメラ権限取得エラー:', permissionError);
                // 権限エラーでも続行を試みる
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setAvailableCameras(videoDevices);

            console.log('検出されたカメラデバイス:', videoDevices);
            console.log('デバイス情報:', deviceInfo);

            // デバイスタイプに応じたカメラ選択ロジック
            let preferredCamera: MediaDeviceInfo | undefined;

            if (deviceInfo.isMobile) {
                // スマートフォン：リアカメラ（環境カメラ）を優先
                preferredCamera = videoDevices.find(device => {
                    const label = device.label.toLowerCase();
                    return label.includes('back') || 
                           label.includes('rear') || 
                           label.includes('environment') ||
                           label.includes('camera2 0') || // Android
                           label.includes('0, facing back'); // iOS
                });
                setFacingMode('environment');
            } else {
                // デスクトップ/ラップトップ：Webカメラ（通常は最初のカメラ）を優先
                preferredCamera = videoDevices.find(device => {
                    const label = device.label.toLowerCase();
                    return label.includes('webcam') || 
                           label.includes('usb') ||
                           label.includes('integrated') ||
                           label.includes('front') ||
                           !label.includes('virtual'); // 仮想カメラを除外
                });
                setFacingMode('user');
            }

            // 優先カメラが見つからない場合は最初のカメラを使用
            if (!preferredCamera && videoDevices.length > 0) {
                preferredCamera = videoDevices[0];
            }

            if (preferredCamera) {
                setSelectedDeviceId(preferredCamera.deviceId);
                console.log(`選択されたカメラ: ${preferredCamera.label} (${deviceInfo.isMobile ? 'モバイル' : 'デスクトップ'})`);
            }

        } catch (err) {
            console.error('カメラデバイス取得エラー:', err);
            if (err instanceof Error && err.name === 'NotAllowedError') {
                setError('カメラの使用が許可されていません。ブラウザの設定でカメラの使用を許可してください。');
            } else {
                setError('カメラデバイスの取得に失敗しました。デバイスにカメラが接続されているか確認してください。');
            }
        }
    }, [deviceInfo]);

    useEffect(() => {
        // コンポーネントマウント時に一度だけ実行
        const deviceType = detectDeviceType();
        setDeviceInfo(deviceType);
    }, []);

    useEffect(() => {
        // deviceInfoが設定された後にカメラを取得
        if (deviceInfo) {
            getAvailableCameras();
        }
    }, [deviceInfo, getAvailableCameras]);

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
        // deviceInfoがまだ設定されていない場合は何もしない
        if (!deviceInfo) return;

        try {
            setError(null);

            // デバイスタイプに応じた最適化された制約
            let constraints: MediaStreamConstraints;

            if (selectedDeviceId) {
                // 特定のデバイスが選択されている場合
                constraints = {
                    video: {
                        deviceId: { exact: selectedDeviceId },
                        width: { ideal: deviceInfo.isMobile ? 1280 : 1920, max: 1920 },
                        height: { ideal: deviceInfo.isMobile ? 720 : 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    }
                };
            } else {
                // facingModeを使用
                constraints = {
                    video: {
                        facingMode: { ideal: facingMode },
                        width: { ideal: deviceInfo.isMobile ? 1280 : 1920, max: 1920 },
                        height: { ideal: deviceInfo.isMobile ? 720 : 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    }
                };
            }

            console.log('カメラ制約:', constraints);
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsCameraOpen(true);

            if (videoRef.current) {
                const video = videoRef.current;
                video.srcObject = mediaStream;
                
                // ビデオイベントリスナーを追加してデバッグ情報を収集
                const updateVideoDebugInfo = () => {
                    if (video) {
                        setVideoDebugInfo({
                            readyState: video.readyState,
                            networkState: video.networkState,
                            currentTime: video.currentTime,
                            duration: video.duration || 0,
                            videoWidth: video.videoWidth,
                            videoHeight: video.videoHeight,
                            paused: video.paused,
                            ended: video.ended
                        });
                    }
                };

                // 既存のイベントリスナーをクリーンアップ
                videoEventListenersRef.current.forEach(cleanup => cleanup());
                videoEventListenersRef.current = [];

                // ビデオイベントリスナーを設定（安定性向上）
                const addVideoEventListener = (event: string, handler: (e?: any) => void) => {
                    video.addEventListener(event, handler);
                    videoEventListenersRef.current.push(() => video.removeEventListener(event, handler));
                };

                addVideoEventListener('loadstart', () => {
                    console.log('Video: loadstart');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('loadedmetadata', () => {
                    console.log('Video: loadedmetadata', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        duration: video.duration
                    });
                    updateVideoDebugInfo();
                });
                addVideoEventListener('loadeddata', () => {
                    console.log('Video: loadeddata');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('canplay', () => {
                    console.log('Video: canplay');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('canplaythrough', () => {
                    console.log('Video: canplaythrough');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('playing', () => {
                    console.log('Video: playing');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('pause', () => {
                    console.log('Video: pause - checking if unexpected');
                    updateVideoDebugInfo();
                    
                    // 予期しない一時停止の場合は自動再生を試行
                    if (stream && stream.active) {
                        console.warn('Unexpected video pause detected, attempting to resume');
                        setTimeout(() => {
                            if (video.paused && !video.ended) {
                                video.play().catch(e => {
                                    console.error('Failed to resume after unexpected pause:', e);
                                    setError('ビデオが一時停止しました。画面をクリックして再開してください。');
                                });
                            }
                        }, 100);
                    }
                });
                addVideoEventListener('ended', () => {
                    console.warn('Video: ended unexpectedly');
                    updateVideoDebugInfo();
                    setError('ビデオが終了しました。カメラを再起動しています...');
                    
                    // 自動的に再起動を試行
                    setTimeout(() => {
                        restartCamera();
                    }, 1000);
                });
                addVideoEventListener('error', (e) => {
                    console.error('Video error:', e);
                    updateVideoDebugInfo();
                    setError('ビデオエラーが発生しました。カメラを再起動してください。');
                });
                addVideoEventListener('emptied', () => {
                    console.warn('Video: emptied (source removed)');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('stalled', () => {
                    console.warn('Video: stalled (network issues)');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('suspend', () => {
                    console.warn('Video: suspend (loading suspended)');
                    updateVideoDebugInfo();
                });
                addVideoEventListener('waiting', () => {
                    console.log('Video: waiting (buffering)');
                    updateVideoDebugInfo();
                });

                // ビデオの再生を確実にする
                try {
                    // メタデータが読み込まれるまで待つ
                    if (video.readyState < 1) {
                        console.log('Waiting for video metadata...');
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Video metadata timeout')), 10000);
                            video.addEventListener('loadedmetadata', () => {
                                clearTimeout(timeout);
                                resolve(undefined);
                            }, { once: true });
                        });
                    }
                    
                    // さらにcanplayイベントを待つ（より確実な再生のため）
                    if (video.readyState < 3) {
                        console.log('Waiting for video canplay...');
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Video canplay timeout')), 5000);
                            video.addEventListener('canplay', () => {
                                clearTimeout(timeout);
                                resolve(undefined);
                            }, { once: true });
                        });
                    }
                    
                    // 明示的にビデオサイズを確認
                    if (video.videoWidth === 0 || video.videoHeight === 0) {
                        console.warn('Video dimensions are 0, but proceeding with play()');
                    }
                    
                    await video.play();
                    console.log('カメラストリーム開始成功', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        readyState: video.readyState
                    });
                    updateVideoDebugInfo();
                } catch (playError) {
                    console.error('ビデオ再生エラー:', playError);
                    updateVideoDebugInfo();
                    
                    // 自動再生に失敗した場合、ユーザーアクションでの再生を試みる
                    const handleUserInteraction = async () => {
                        try {
                            await video.play();
                            console.log('ユーザーアクション後の再生成功');
                            updateVideoDebugInfo();
                            // イベントリスナーを削除
                            video.removeEventListener('click', handleUserInteraction);
                        } catch (userPlayError) {
                            console.error('ユーザーアクション後の再生もエラー:', userPlayError);
                        }
                    };
                    
                    video.addEventListener('click', handleUserInteraction, { once: true });
                    setError('カメラは起動しましたが、映像の表示に問題があります。ビデオエリアをクリックして再生を試してください。');
                }

                // 3秒後にビデオが再生されていない場合の追加チェック
                setTimeout(() => {
                    if (video && video.paused && stream && stream.active) {
                        console.warn('Video still paused after 3 seconds, attempting force play');
                        video.play().catch(e => {
                            console.error('Force play after timeout failed:', e);
                            setError('映像の表示に問題があります。「映像を表示」ボタンまたはビデオエリアをクリックしてください。');
                        });
                    }
                }, 3000);
            }

            // 実際に使用されているカメラ情報をログ出力
            const track = mediaStream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings();
                console.log('使用中のカメラ設定:', settings);
                
                // ストリームの状態を詳細に確認
                console.log('MediaStream詳細:', {
                    id: mediaStream.id,
                    active: mediaStream.active,
                    videoTracks: mediaStream.getVideoTracks().length,
                    audioTracks: mediaStream.getAudioTracks().length,
                    trackState: track.readyState,
                    trackEnabled: track.enabled,
                    trackMuted: track.muted,
                    constraints: track.getConstraints(),
                    capabilities: track.getCapabilities ? track.getCapabilities() : 'Not supported'
                });

                // トラックの終了を監視
                track.addEventListener('ended', () => {
                    console.warn('Video track ended unexpectedly');
                    setError('カメラストリームが予期せず終了しました。カメラを再起動してください。');
                    setIsCameraOpen(false);
                });

                track.addEventListener('mute', () => {
                    console.warn('Video track muted');
                    setError('カメラがミュートされました。他のアプリケーションでカメラが使用されている可能性があります。');
                });

                track.addEventListener('unmute', () => {
                    console.log('Video track unmuted');
                    setError(null);
                });

                // MediaStreamの継続監視を開始
                const monitorId = setInterval(() => {
                    if (mediaStream && track) {
                        const isActive = mediaStream.active;
                        const isLive = track.readyState === 'live';
                        const trackEnabled = track.enabled;
                        const trackMuted = track.muted;

                        console.log('Stream monitor check:', {
                            streamActive: isActive,
                            trackLive: isLive,
                            trackEnabled: trackEnabled,
                            trackMuted: trackMuted,
                            timestamp: new Date().toISOString()
                        });

                        // ストリームが非アクティブになった場合
                        if (!isActive) {
                            console.error('MediaStream became inactive');
                            setError('カメラストリームが停止しました。自動的に再起動を試みます...');
                            clearInterval(monitorId);
                            setStreamMonitorId(null);
                            
                            // 2秒後に自動再起動を試行
                            setTimeout(() => {
                                console.log('Attempting automatic camera restart...');
                                restartCamera();
                            }, 2000);
                            return;
                        }

                        // トラックが終了した場合
                        if (track.readyState === 'ended') {
                            console.error('Video track ended during monitoring');
                            setError('カメラトラックが終了しました。自動的に再起動を試みます...');
                            clearInterval(monitorId);
                            setStreamMonitorId(null);
                            
                            setTimeout(() => {
                                restartCamera();
                            }, 2000);
                            return;
                        }

                        // ビデオ要素の状態も確認
                        if (videoRef.current) {
                            const video = videoRef.current;
                            if (video.ended) {
                                console.warn('Video element ended unexpectedly');
                                video.play().catch(e => {
                                    console.error('Failed to restart video playback:', e);
                                    setError('ビデオの再生が停止しました。画面をクリックして再開してください。');
                                });
                            }
                        }
                    }
                }, 1000); // 1秒ごとに監視

                setStreamMonitorId(monitorId);
            } else {
                console.error('No video track found in MediaStream');
                setError('ビデオトラックが見つかりません。カメラの接続を確認してください。');
            }

        } catch (err) {
            console.error('カメラアクセスエラー:', err);
            let errorMessage = 'カメラにアクセスできませんでした。';

            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    errorMessage = 'カメラの使用が許可されていません。ブラウザの設定でカメラの使用を許可してください。';
                } else if (err.name === 'NotFoundError') {
                    errorMessage = `カメラが見つかりませんでした。${deviceInfo.isMobile ? 'デバイスのカメラが正常に動作しているか' : 'ウェブカメラが接続されているか'}確認してください。`;
                } else if (err.name === 'NotReadableError') {
                    errorMessage = 'カメラは他のアプリケーションで使用中です。他のアプリを終了してから再試行してください。';
                } else if (err.name === 'OverconstrainedError') {
                    errorMessage = 'カメラの設定に問題があります。他のカメラを試すか、ページを再読み込みしてください。';
                } else if (err.name === 'AbortError') {
                    errorMessage = 'カメラの起動がキャンセルされました。';
                } else {
                    errorMessage = `カメラエラー: ${err.message}`;
                }
            }

            setError(errorMessage);
        }
    }, [facingMode, selectedDeviceId, deviceInfo]);

    // カメラストリームの停止
    const stopCamera = useCallback(() => {
        // ストリーム監視を停止
        if (streamMonitorId) {
            clearInterval(streamMonitorId);
            setStreamMonitorId(null);
            console.log('Stream monitoring stopped');
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
        if (videoRef.current) {
            // イベントリスナーをクリーンアップ
            const video = videoRef.current;
            video.srcObject = null;
            
            // 保存されたイベントリスナーのクリーンアップ関数を実行
            videoEventListenersRef.current.forEach(cleanup => cleanup());
            videoEventListenersRef.current = [];
            
            video.pause();
        }
        setVideoDebugInfo(null);
        setError(null);
    }, [stream, streamMonitorId]);

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

    // カメラの向きを切り替え（facingMode使用）
    const switchCameraFacing = useCallback(() => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);
        setSelectedDeviceId(''); // デバイスIDをリセット
        
        console.log(`カメラ向き切り替え: ${facingMode} → ${newFacingMode}`);
        
        if (isCameraOpen) {
            stopCamera();
            // 少し待ってから新しい向きでカメラを開始
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    }, [facingMode, isCameraOpen, stopCamera, startCamera]);

    // 特定のカメラデバイスに切り替え
    const switchToCamera = useCallback((deviceId: string) => {
        console.log(`カメラデバイス切り替え: ${deviceId}`);
        setSelectedDeviceId(deviceId);
        if (isCameraOpen) {
            stopCamera();
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    }, [isCameraOpen, stopCamera, startCamera]);

    // コンポーネントのクリーンアップ
    useEffect(() => {
        // ページを離れる際のクリーンアップ
        const handleBeforeUnload = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (streamMonitorId) {
                clearInterval(streamMonitorId);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            handleBeforeUnload();
            window.removeEventListener('beforeunload', handleBeforeUnload);
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

    // カメラ権限を確認する関数
    const checkCameraPermissions = useCallback(async () => {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                console.log('Camera permission status:', permission.state);
                return permission.state === 'granted';
            }
            return null; // 権限APIが利用できない場合
        } catch (error) {
            console.warn('Cannot check camera permissions:', error);
            return null;
        }
    }, []);

    // 手動でカメラを再起動する関数
    const restartCamera = useCallback(async () => {
        console.log('Camera restart requested');
        
        // 現在のストリームを停止
        if (isCameraOpen) {
            stopCamera();
        }
        
        // 少し待ってから再起動
        setTimeout(async () => {
            try {
                const hasPermission = await checkCameraPermissions();
                if (hasPermission === false) {
                    setError('カメラの使用が許可されていません。ブラウザの設定を確認してください。');
                    return;
                }
                
                // startCameraの処理を直接実行（循環参照を避けるため）
                if (!deviceInfo) {
                    setError('デバイス情報が読み込まれていません。ページを再読み込みしてください。');
                    return;
                }

                setError(null);

                // デバイスタイプに応じた最適化された制約
                let constraints: MediaStreamConstraints;

                if (selectedDeviceId) {
                    constraints = {
                        video: {
                            deviceId: { exact: selectedDeviceId },
                            width: { ideal: deviceInfo.isMobile ? 1280 : 1920, max: 1920 },
                            height: { ideal: deviceInfo.isMobile ? 720 : 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 60 }
                        }
                    };
                } else {
                    constraints = {
                        video: {
                            facingMode: { ideal: facingMode },
                            width: { ideal: deviceInfo.isMobile ? 1280 : 1920, max: 1920 },
                            height: { ideal: deviceInfo.isMobile ? 720 : 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 60 }
                        }
                    };
                }

                console.log('Restart: Camera constraints:', constraints);
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(mediaStream);
                setIsCameraOpen(true);

                if (videoRef.current) {
                    const video = videoRef.current;
                    video.srcObject = mediaStream;
                    
                    // 基本的なイベントリスナーのみ設定（重複を避ける）
                    video.addEventListener('ended', () => {
                        console.warn('Video ended after restart');
                        setIsCameraOpen(false);
                    }, { once: true });

                    try {
                        await video.play();
                        console.log('Camera restart successful');
                        setError(null);
                    } catch (playError) {
                        console.error('Video play failed after restart:', playError);
                        setError('カメラは再起動しましたが、映像表示に問題があります。画面をクリックしてください。');
                    }
                }

                console.log('Camera restart completed successfully');
            } catch (err) {
                console.error('Camera restart failed:', err);
                setError('カメラの再起動に失敗しました。手動で「カメラを再起動」ボタンを押してください。');
                setIsCameraOpen(false);
            }
        }, 500);
    }, [isCameraOpen, stopCamera, checkCameraPermissions, deviceInfo, selectedDeviceId, facingMode]);

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

            {/* デバイス情報表示 */}
            {deviceInfo ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                        {deviceInfo.isMobile ? (
                            <Smartphone className="w-4 h-4" />
                        ) : (
                            <Monitor className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                            {deviceInfo.isMobile ? 'スマートフォン' : 'コンピュータ'}モードで実行中
                        </span>
                        <span className="text-blue-600">
                            （{deviceInfo.isMobile ? 'リアカメラ' : 'Webカメラ'}優先）
                        </span>
                    </div>
                    {availableCameras.length > 0 && (
                        <div className="text-center text-xs text-blue-600 mt-1">
                            {availableCameras.length}台のカメラを検出済み
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>デバイス情報を読み込み中...</span>
                    </div>
                </div>
            )}

            {/* エラー表示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                    <div className="mt-2 text-xs text-red-600">
                        デバイスタイプ: {deviceInfo?.isMobile ? 'モバイル' : 'デスクトップ'} | 
                        プラットフォーム: {
                            deviceInfo?.platform.isIOS ? 'iOS' :
                            deviceInfo?.platform.isAndroid ? 'Android' :
                            deviceInfo?.platform.isWindows ? 'Windows' :
                            deviceInfo?.platform.isMac ? 'Mac' : '不明'
                        }
                    </div>
                </div>
            )}

            {/* カメラ状態表示 */}
            {isCameraOpen && videoDebugInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">📹 カメラ状態</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-700">
                            <span className="font-medium">状態:</span> {videoDebugInfo.paused ? '一時停止' : '再生中'}
                        </div>
                        <div className="text-green-700">
                            <span className="font-medium">解像度:</span> {videoDebugInfo.videoWidth}×{videoDebugInfo.videoHeight}
                        </div>
                        <div className="text-green-700">
                            <span className="font-medium">準備状態:</span> {videoDebugInfo.readyState}/4
                        </div>
                        <div className="text-green-700">
                            <span className="font-medium">ネットワーク:</span> {videoDebugInfo.networkState}/3
                        </div>
                    </div>
                    {(videoDebugInfo.videoWidth === 0 || videoDebugInfo.videoHeight === 0) && (
                        <div className="mt-2 text-orange-600 text-sm">
                            ⚠️ 映像サイズが0です。カメラの接続を確認してください。
                        </div>
                    )}
                    {videoDebugInfo.paused && (
                        <div className="mt-2 text-orange-600 text-sm">
                            ⚠️ ビデオが一時停止中です。画面をクリックして再生してください。
                        </div>
                    )}
                </div>
            )}

            {/* カメラビュー */}
            {isCameraOpen && (
                <div className="space-y-4 mb-6">
                    {/* カメラ選択ボタン */}
                    {availableCameras.length > 1 && (
                        <div className="flex space-x-2 mb-4">
                            {availableCameras.map((camera, index) => {
                                const isRearCamera = camera.label.toLowerCase().includes('back') ||
                                    camera.label.toLowerCase().includes('rear') ||
                                    camera.label.toLowerCase().includes('environment');
                                const isFrontCamera = camera.label.toLowerCase().includes('front') ||
                                    camera.label.toLowerCase().includes('user') ||
                                    camera.label.toLowerCase().includes('face');

                                return (
                                    <button
                                        key={camera.deviceId}
                                        onClick={() => switchToCamera(camera.deviceId)}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${selectedDeviceId === camera.deviceId
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            {isRearCamera ? (
                                                <Monitor className="w-5 h-5" />
                                            ) : isFrontCamera ? (
                                                <Smartphone className="w-5 h-5" />
                                            ) : (
                                                <Camera className="w-5 h-5" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {isRearCamera ? 'リアカメラ' :
                                                    isFrontCamera ? 'フロントカメラ' :
                                                        `カメラ${index + 1}`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            controls={false}
                            className="w-full h-64 object-cover"
                            style={{ 
                                display: 'block',
                                backgroundColor: '#000',
                                minHeight: '256px',
                                maxHeight: '256px',
                                width: '100%',
                                objectFit: 'cover'
                            }}
                            onLoadStart={() => {
                                console.log('Video onLoadStart');
                                if (videoRef.current) {
                                    console.log('Video element properties:', {
                                        src: videoRef.current.src,
                                        srcObject: videoRef.current.srcObject,
                                        readyState: videoRef.current.readyState,
                                        networkState: videoRef.current.networkState
                                    });
                                }
                            }}
                            onLoadedData={() => console.log('Video onLoadedData')}
                            onCanPlay={() => {
                                console.log('Video onCanPlay');
                                // canplayイベントで再度play()を試行
                                if (videoRef.current && videoRef.current.paused) {
                                    videoRef.current.play().catch(e => console.warn('Play after canplay failed:', e));
                                }
                            }}
                            onPlaying={() => console.log('Video onPlaying')}
                            onError={(e) => console.error('Video onError:', e)}
                            onClick={() => {
                                // クリック時に手動再生を試行
                                if (videoRef.current) {
                                    videoRef.current.play().catch(e => console.warn('Manual play failed:', e));
                                }
                            }}
                        />

                        {/* ビデオが表示されていない場合の代替表示 */}
                        {videoDebugInfo && (videoDebugInfo.videoWidth === 0 || videoDebugInfo.videoHeight === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <p className="text-sm mb-3">カメラを読み込み中...</p>
                                    <button
                                        onClick={() => {
                                            console.log('Manual video play button clicked');
                                            if (videoRef.current) {
                                                videoRef.current.play()
                                                    .then(() => console.log('Manual play successful'))
                                                    .catch(e => console.error('Manual play failed:', e));
                                            }
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                    >
                                        映像を表示
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ビデオが一時停止している場合の再生ボタン */}
                        {videoDebugInfo && videoDebugInfo.paused && videoDebugInfo.videoWidth > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                                <button
                                    onClick={() => {
                                        console.log('Play button clicked');
                                        if (videoRef.current) {
                                            videoRef.current.play()
                                                .then(() => console.log('Play after pause successful'))
                                                .catch(e => console.error('Play after pause failed:', e));
                                        }
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
                                >
                                    <Camera className="w-8 h-8" />
                                </button>
                            </div>
                        )}

                        {/* デバッグ情報表示（開発時のみ） */}
                        {videoDebugInfo && process.env.NODE_ENV === 'development' && (
                            <div className="absolute top-16 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs max-w-xs">
                                <div>Ready: {videoDebugInfo.readyState}/4</div>
                                <div>Network: {videoDebugInfo.networkState}/3</div>
                                <div>Size: {videoDebugInfo.videoWidth}x{videoDebugInfo.videoHeight}</div>
                                <div>Time: {videoDebugInfo.currentTime.toFixed(2)}s</div>
                                <div>Paused: {videoDebugInfo.paused ? 'Yes' : 'No'}</div>
                            </div>
                        )}

                        {/* カメラコントロール */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                            {availableCameras.length > 1 && (
                                <button
                                    onClick={switchCameraFacing}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
                                    title="カメラを切り替え"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>
                            )}

                            <button
                                onClick={capturePhoto}
                                className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full transition-all shadow-lg"
                                title="写真を撮影"
                            >
                                <Camera className="w-8 h-8" />
                            </button>

                            <button
                                onClick={stopCamera}
                                className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-3 rounded-full transition-all"
                                title="カメラを閉じる"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* 現在のカメラ表示 */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {selectedDeviceId ? (
                                availableCameras.find(cam => cam.deviceId === selectedDeviceId)?.label.includes('back') ||
                                    availableCameras.find(cam => cam.deviceId === selectedDeviceId)?.label.includes('rear') ?
                                    'リアカメラ' : 'フロントカメラ'
                            ) : (
                                facingMode === 'environment' ? 'リアカメラ' : 'フロントカメラ'
                            )}
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
                            capture={deviceInfo?.isMobile ? "environment" : undefined}
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
                            {deviceInfo?.isMobile ? (
                                <li>• 📱 スマホ：自動的にリアカメラが起動します</li>
                            ) : (
                                <li>• 💻 PC：Webカメラが起動します</li>
                            )}
                            <li>• フロント/リアカメラの切り替え可能</li>
                            <li>• AI が自動で植物を認識</li>
                            <li>• 食べられる草花は恐竜のエサに</li>
                            <li>• 新種発見でボーナス！</li>
                        </ul>
                    </div>

                    {/* トラブルシューティング */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">🔧 カメラが起動しない場合</h3>
                        <ul className="text-sm text-blue-700 space-y-1 mb-3">
                            <li>• ブラウザでカメラの使用を許可してください</li>
                            {deviceInfo?.isMobile ? (
                                <>
                                    <li>• 📱 スマホ：他のカメラアプリを終了してください</li>
                                    <li>• プライベートモードではカメラ制限があります</li>
                                </>
                            ) : (
                                <>
                                    <li>• 💻 PC：Webカメラが正しく接続されているか確認</li>
                                    <li>• 他のビデオ通話アプリを終了してください</li>
                                </>
                            )}
                            <li>• ページを再読み込みして再試行</li>
                            <li>• HTTPS接続が必要です（HTTPでは動作しません）</li>
                        </ul>
                        <button
                            onClick={restartCamera}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm transition-colors"
                        >
                            カメラを再起動
                        </button>
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