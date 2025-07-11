import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = await params;

        // Mockユーザーデータ
        const mockUser = {
            id: userId,
            clerkId: userId,
            email: 'user@example.com',
            firstName: 'テスト',
            lastName: 'ユーザー',
            nickname: 'ディノウォーカー',
            age: 65,
            totalSteps: 5420,
            coins: 150,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return NextResponse.json(mockUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 