import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, MapPin, Zap, Settings } from 'lucide-react';

interface PermissionState {
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  motion: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface PermissionHandlerProps {
  onPermissionsChange: (permissions: { location: boolean; motion: boolean }) => void;
}

export default function PermissionHandler({ onPermissionsChange }: PermissionHandlerProps) {
  const [permissions, setPermissions] = useState<PermissionState>({
    location: 'unknown',
    motion: 'unknown',
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // 位置情報の許可状態をチェック
  const checkLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (!navigator.geolocation) {
      return 'denied';
    }

    try {
      // navigator.permissions が利用可能な場合
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state as 'granted' | 'denied' | 'prompt';
      }
      
      // フォールバック: 実際に位置情報を取得してみる
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve('denied');
            } else {
              resolve('prompt');
            }
          },
          { timeout: 5000 }
        );
      });
    } catch (error) {
      return 'prompt';
    }
  };

  // 加速度センサーの許可状態をチェック
  const checkMotionPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (!('DeviceMotionEvent' in window)) {
      return 'denied';
    }

    try {
      // iOS 13+ の場合は明示的な許可が必要
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted' ? 'granted' : 'denied';
      }
      
      // Android や古いブラウザの場合は通常許可されている
      return 'granted';
    } catch (error) {
      return 'prompt';
    }
  };

  // 許可状態を確認
  const checkPermissions = async () => {
    setIsChecking(true);
    
    try {
      const locationState = await checkLocationPermission();
      const motionState = await checkMotionPermission();
      
      setPermissions({
        location: locationState,
        motion: motionState,
      });

      // 親コンポーネントに通知
      onPermissionsChange({
        location: locationState === 'granted',
        motion: motionState === 'granted',
      });
    } catch (error) {
      console.error('Permission check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // 位置情報の許可を要求
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert('このブラウザは位置情報をサポートしていません。');
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
      
      await checkPermissions();
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        alert('位置情報の許可が拒否されました。ブラウザの設定から許可してください。');
        setShowInstructions(true);
      } else {
        alert('位置情報の取得に失敗しました。');
      }
    }
  };

  // 加速度センサーの許可を要求
  const requestMotionPermission = async () => {
    if (!('DeviceMotionEvent' in window)) {
      alert('このデバイスは加速度センサーをサポートしていません。');
      return;
    }

    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          alert('加速度センサーの許可が拒否されました。');
          setShowInstructions(true);
        }
      }
      
      await checkPermissions();
    } catch (error) {
      alert('加速度センサーの許可要求に失敗しました。');
    }
  };

  // 初回チェック
  useEffect(() => {
    checkPermissions();
  }, []);

  const getPermissionIcon = (state: string) => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPermissionText = (state: string) => {
    switch (state) {
      case 'granted':
        return '許可済み';
      case 'denied':
        return '拒否済み';
      case 'prompt':
        return '未設定';
      default:
        return '確認中...';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        センサー許可設定
      </h3>

      <div className="space-y-4">
        {/* 位置情報の許可 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <div className="font-medium text-gray-800">位置情報（GPS）</div>
              <div className="text-sm text-gray-600">移動距離の計算に使用</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getPermissionIcon(permissions.location)}
            <span className="text-sm font-medium">
              {getPermissionText(permissions.location)}
            </span>
            {permissions.location !== 'granted' && (
              <button
                onClick={requestLocationPermission}
                disabled={isChecking}
                className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
              >
                許可
              </button>
            )}
          </div>
        </div>

        {/* 加速度センサーの許可 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-orange-500 mr-3" />
            <div>
              <div className="font-medium text-gray-800">加速度センサー</div>
              <div className="text-sm text-gray-600">歩数の検出に使用</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getPermissionIcon(permissions.motion)}
            <span className="text-sm font-medium">
              {getPermissionText(permissions.motion)}
            </span>
            {permissions.motion !== 'granted' && (
              <button
                onClick={requestMotionPermission}
                disabled={isChecking}
                className="ml-2 px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
              >
                許可
              </button>
            )}
          </div>
        </div>

        {/* 再チェックボタン */}
        <button
          onClick={checkPermissions}
          disabled={isChecking}
          className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {isChecking ? '確認中...' : '許可状態を再確認'}
        </button>

        {/* 設定手順の表示 */}
        {showInstructions && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">手動設定手順</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>1. ブラウザのアドレスバー左側の鍵アイコンをクリック</p>
              <p>2. 「位置情報」と「センサー」を「許可」に変更</p>
              <p>3. ページを再読み込みして「許可状態を再確認」をクリック</p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-2 text-xs text-yellow-600 hover:text-yellow-800"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 