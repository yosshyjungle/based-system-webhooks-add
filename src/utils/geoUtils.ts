// 地球の半径（キロメートル）
const EARTH_RADIUS_KM = 6371;

// 度をラジアンに変換
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// ラジアンを度に変換
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

// 位置情報の型定義
export interface Position {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

// 2点間の距離を計算（ハヴァーサイン公式）
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const lat1Rad = toRadians(pos1.latitude);
  const lat2Rad = toRadians(pos2.latitude);
  const deltaLatRad = toRadians(pos2.latitude - pos1.latitude);
  const deltaLonRad = toRadians(pos2.longitude - pos1.longitude);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // 距離をメートルで返す
  return EARTH_RADIUS_KM * c * 1000;
};

// 移動速度を計算（m/s）
export const calculateSpeed = (pos1: Position, pos2: Position): number => {
  if (!pos1.timestamp || !pos2.timestamp) {
    return 0;
  }

  const distance = calculateDistance(pos1, pos2);
  const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // 秒に変換
  
  if (timeDiff <= 0) {
    return 0;
  }

  return distance / timeDiff;
};

// 移動距離の履歴から総距離を計算
export const calculateTotalDistance = (positions: Position[]): number => {
  if (positions.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    const distance = calculateDistance(positions[i - 1], positions[i]);
    
    // 異常に大きな移動距離は除外（GPS誤差対応）
    if (distance < 1000) { // 1km以下の移動のみ有効とする
      totalDistance += distance;
    }
  }

  return totalDistance;
};

// 位置の精度をチェック
export const isAccuratePosition = (accuracy: number | null): boolean => {
  if (accuracy === null) return false;
  return accuracy <= 50; // 50メートル以下の精度を有効とする
};

// 移動しているかどうかを判定
export const isMoving = (pos1: Position, pos2: Position, threshold: number = 5): boolean => {
  const distance = calculateDistance(pos1, pos2);
  return distance > threshold; // 5メートル以上の移動で「移動中」と判定
};

// 歩行速度の範囲内かどうかをチェック
export const isWalkingSpeed = (speed: number): boolean => {
  // 歩行速度の範囲：0.5m/s（1.8km/h）〜 2.5m/s（9km/h）
  return speed >= 0.5 && speed <= 2.5;
};

// 位置履歴をフィルタリング（異常値を除去）
export const filterPositions = (positions: Position[]): Position[] => {
  if (positions.length < 2) {
    return positions;
  }

  const filtered: Position[] = [positions[0]];
  
  for (let i = 1; i < positions.length; i++) {
    const currentPos = positions[i];
    const lastValidPos = filtered[filtered.length - 1];
    
    const distance = calculateDistance(lastValidPos, currentPos);
    const speed = calculateSpeed(lastValidPos, currentPos);
    
    // 異常に大きな移動距離や速度は除外
    if (distance < 1000 && (speed === 0 || isWalkingSpeed(speed))) {
      filtered.push(currentPos);
    }
  }

  return filtered;
};

// 距離を人間が読みやすい形式に変換
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

// 速度を人間が読みやすい形式に変換
export const formatSpeed = (metersPerSecond: number): string => {
  const kmPerHour = metersPerSecond * 3.6;
  return `${kmPerHour.toFixed(1)}km/h`;
}; 