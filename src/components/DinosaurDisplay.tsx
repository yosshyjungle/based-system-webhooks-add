'use client';

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

interface DinosaurDisplayProps {
    dinosaur: DinosaurData | null;
}

export default function DinosaurDisplay({ dinosaur }: DinosaurDisplayProps) {
    if (!dinosaur) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">🥚</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">恐竜の卵</h3>
                <p className="text-gray-600">歩いて恐竜を孵化させましょう！</p>
            </div>
        );
    }

    const getDinosaurEmoji = () => {
        switch (dinosaur.appearanceState) {
            case 'baby':
                return '🦕'; // 赤ちゃん恐竜
            case 'child':
                return '🦖'; // 子供恐竜
            case 'adult':
                return '🦴'; // 大人恐竜（骨格）
            default:
                return '🦕';
        }
    };

    const getDinosaurAnimation = () => {
        if (dinosaur.hunger < 30) {
            return 'animate-pulse'; // お腹が空いている時
        }
        return 'animate-bounce'; // 元気な時
    };

    const nextLevelExp = (dinosaur.level) * 100;
    const currentLevelExp = nextLevelExp - 100;
    const expProgress = ((dinosaur.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

    return (
        <div className="text-center">
            {/* 恐竜の表示 */}
            <div className={`text-8xl mb-4 ${getDinosaurAnimation()}`}>
                {getDinosaurEmoji()}
            </div>

            {/* 恐竜の情報 */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{dinosaur.name}</h3>
                <p className="text-gray-600 text-sm">{dinosaur.species}</p>
                <p className="text-gray-500 text-xs">{dinosaur.appearanceState === 'baby' ? '赤ちゃん' : dinosaur.appearanceState === 'child' ? '子供' : '大人'}</p>
            </div>

            {/* レベルと経験値 */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">レベル {dinosaur.level}</span>
                    <span className="text-xs text-gray-500">{dinosaur.experience}/{nextLevelExp} EXP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, expProgress))}%` }}
                    ></div>
                </div>
            </div>

            {/* ステータスメッセージ */}
            <div className="text-sm">
                {dinosaur.hunger > 70 && (
                    <p className="text-green-600">元気いっぱいです！</p>
                )}
                {dinosaur.hunger <= 70 && dinosaur.hunger > 30 && (
                    <p className="text-yellow-600">少しお腹が空いています。</p>
                )}
                {dinosaur.hunger <= 30 && (
                    <p className="text-red-600">とてもお腹が空いています！</p>
                )}
            </div>
        </div>
    );
} 