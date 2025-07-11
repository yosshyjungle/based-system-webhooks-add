import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = await params;

        // Mock恐竜データ
        const mockDinosaur = {
            id: 'dino_' + userId,
            name: 'マイ恐竜',
            level: 5,
            experience: 450,
            hunger: 75,
            species: 'トリケラトプス',
            appearanceState: 'child',
            lastFed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return NextResponse.json(mockDinosaur);
    } catch (error) {
        console.error('Error fetching dinosaur:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 