import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = await params;

        // Mock歩数データ
        const mockStepsData = {
            userId,
            totalSteps: 5420,
            todaySteps: 2150,
            lastUpdated: new Date(),
        };

        return NextResponse.json(mockStepsData);
    } catch (error) {
        console.error('Error fetching user steps:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 