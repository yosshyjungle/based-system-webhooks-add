import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, steps } = await request.json();

        if (!userId || typeof steps !== 'number') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Mock レスポンス
        const result = {
            success: true,
            userId,
            newTotalSteps: steps,
            experienceGained: Math.max(0, steps - 5420), // 前回からの差分
            message: '歩数を更新しました！'
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating steps:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 