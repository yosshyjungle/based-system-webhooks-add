import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, name = "マイ恐竜" } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Mock恐竜を作成
        const dinosaur = {
            id: 'dino_' + userId,
            name,
            level: 1,
            experience: 0,
            hunger: 100,
            species: 'トリケラトプス',
            appearanceState: 'baby',
            lastFed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return NextResponse.json(dinosaur);
    } catch (error) {
        console.error('Error creating dinosaur:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 