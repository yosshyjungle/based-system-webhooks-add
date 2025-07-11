'use client';

import { useState, useEffect } from 'react';
import { Book, Search, Filter, Star, Leaf } from 'lucide-react';

interface EncyclopediaProps {
    userId: string;
}

interface PlantEntry {
    id: string;
    name: string;
    scientificName?: string;
    imageUrl: string;
    isEdible: boolean;
    nutritionValue: number;
    rarity: string;
    isNewSpecies: boolean;
    discoveredAt: Date;
}

export default function Encyclopedia({ userId }: EncyclopediaProps) {
    const [plants, setPlants] = useState<PlantEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRarity, setFilterRarity] = useState('all');

    useEffect(() => {
        loadPlants();
    }, [userId]);

    // Mock データ（実際のMVPではAPIから取得）
    const mockPlants: PlantEntry[] = [
        {
            id: '1',
            name: 'タンポポ',
            scientificName: 'Taraxacum officinale',
            imageUrl: '/api/placeholder/plant1.jpg',
            isEdible: true,
            nutritionValue: 15,
            rarity: 'common',
            isNewSpecies: false,
            discoveredAt: new Date('2024-01-15')
        },
        {
            id: '2',
            name: 'クローバー',
            scientificName: 'Trifolium repens',
            imageUrl: '/api/placeholder/plant2.jpg',
            isEdible: true,
            nutritionValue: 10,
            rarity: 'common',
            isNewSpecies: false,
            discoveredAt: new Date('2024-01-16')
        },
        {
            id: '3',
            name: 'イチゴの葉',
            scientificName: 'Fragaria × ananassa',
            imageUrl: '/api/placeholder/plant3.jpg',
            isEdible: true,
            nutritionValue: 25,
            rarity: 'uncommon',
            isNewSpecies: false,
            discoveredAt: new Date('2024-01-17')
        },
        {
            id: '4',
            name: 'レアプラント',
            scientificName: 'Plantae rara',
            imageUrl: '/api/placeholder/plant4.jpg',
            isEdible: true,
            nutritionValue: 50,
            rarity: 'rare',
            isNewSpecies: true,
            discoveredAt: new Date('2024-01-18')
        }
    ];

    const loadPlants = async () => {
        try {
            // 実際のAPIコール
            // const response = await fetch(`/api/plants/${userId}`);
            // if (response.ok) {
            //   const plantsData = await response.json();
            //   setPlants(plantsData);
            // }

            // Mock データを使用
            setTimeout(() => {
                setPlants(mockPlants);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading plants:', error);
            setLoading(false);
        }
    };

    const filteredPlants = plants
        .filter(plant => {
            const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plant.scientificName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesRarity = filterRarity === 'all' || plant.rarity === filterRarity;
            return matchesSearch && matchesRarity;
        })
        .sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-600 bg-gray-100';
            case 'uncommon': return 'text-green-600 bg-green-100';
            case 'rare': return 'text-blue-600 bg-blue-100';
            case 'legendary': return 'text-purple-600 bg-purple-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getRarityText = (rarity: string) => {
        switch (rarity) {
            case 'common': return '一般的';
            case 'uncommon': return '珍しい';
            case 'rare': return 'レア';
            case 'legendary': return '伝説';
            default: return '一般的';
        }
    };

    const getTotalsByRarity = () => {
        const totals = {
            common: plants.filter(p => p.rarity === 'common').length,
            uncommon: plants.filter(p => p.rarity === 'uncommon').length,
            rare: plants.filter(p => p.rarity === 'rare').length,
            legendary: plants.filter(p => p.rarity === 'legendary').length,
            newSpecies: plants.filter(p => p.isNewSpecies).length
        };
        return totals;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-green-800">図鑑を読み込み中...</p>
                    </div>
                </div>
            </div>
        );
    }

    const stats = getTotalsByRarity();

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">植物図鑑</h2>

            {/* 統計情報 */}
            <div className="bg-white rounded-lg p-4 shadow-md mb-6">
                <div className="flex items-center mb-3">
                    <Book className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-gray-800">発見済み植物</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{plants.length}</div>
                        <div className="text-sm text-gray-600">総数</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-600">{stats.newSpecies}</div>
                        <div className="text-sm text-gray-600">新種</div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                        <div className="text-gray-600 font-semibold">{stats.common}</div>
                        <div className="text-gray-500">一般</div>
                    </div>
                    <div className="text-center">
                        <div className="text-green-600 font-semibold">{stats.uncommon}</div>
                        <div className="text-gray-500">珍しい</div>
                    </div>
                    <div className="text-center">
                        <div className="text-blue-600 font-semibold">{stats.rare}</div>
                        <div className="text-gray-500">レア</div>
                    </div>
                    <div className="text-center">
                        <div className="text-purple-600 font-semibold">{stats.legendary}</div>
                        <div className="text-gray-500">伝説</div>
                    </div>
                </div>
            </div>

            {/* 検索・フィルター */}
            <div className="space-y-4 mb-6">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="植物名で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <select
                        value={filterRarity}
                        onChange={(e) => setFilterRarity(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="all">すべて</option>
                        <option value="common">一般的</option>
                        <option value="uncommon">珍しい</option>
                        <option value="rare">レア</option>
                        <option value="legendary">伝説</option>
                    </select>
                </div>
            </div>

            {/* 植物リスト */}
            {filteredPlants.length === 0 ? (
                <div className="text-center py-12">
                    <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                        {plants.length === 0
                            ? 'まだ植物を発見していません。散歩に出かけて植物を撮影しましょう！'
                            : '条件に合う植物が見つかりませんでした。'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPlants.map((plant) => (
                        <div key={plant.id} className="bg-white rounded-lg p-4 shadow-md">
                            <div className="flex space-x-4">
                                {/* 植物画像 */}
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Leaf className="w-8 h-8 text-gray-400" />
                                    {/* 実際の画像を表示する場合 */}
                                    {/* <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover rounded-lg" /> */}
                                </div>

                                {/* 植物情報 */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-800 flex items-center">
                                                {plant.name}
                                                {plant.isNewSpecies && (
                                                    <Star className="w-4 h-4 text-yellow-500 ml-2" />
                                                )}
                                            </h3>
                                            {plant.scientificName && (
                                                <p className="text-sm text-gray-600 italic">{plant.scientificName}</p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(plant.rarity)}`}>
                                            {getRarityText(plant.rarity)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-4">
                                            <span className={`${plant.isEdible ? 'text-green-600' : 'text-red-600'}`}>
                                                {plant.isEdible ? '🍃 食用可' : '⚠️ 毒草'}
                                            </span>
                                            {plant.isEdible && (
                                                <span className="text-gray-600">
                                                    栄養価: {plant.nutritionValue}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-gray-500">
                                            {new Date(plant.discoveredAt).toLocaleDateString('ja-JP')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 