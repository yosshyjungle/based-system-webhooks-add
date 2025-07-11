import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, nutritionValue = 20 } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Mockレスポンス
        const result = {
            success: true,
            newHunger: Math.min(100, 75 + nutritionValue),
            message: `恐竜に${nutritionValue}ポイントの栄養を与えました！`
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error feeding dinosaur:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 