import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, plantData, imageUrl } = await request.json();

        if (!userId || !plantData) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Mock レスポンス - 植物を図鑑に追加
        const result = {
            success: true,
            plantId: 'plant_' + Date.now(),
            name: plantData.name,
            isNewSpecies: plantData.isNewSpecies,
            coinsEarned: plantData.isNewSpecies ? 50 : 10,
            message: plantData.isNewSpecies
                ? `新種「${plantData.name}」を発見しました！50コインを獲得！`
                : `「${plantData.name}」を図鑑に追加しました！10コインを獲得！`
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error adding plant:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 