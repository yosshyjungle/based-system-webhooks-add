import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserData {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ClerkIDでユーザーを取得
export async function getUserByClerkId(clerkId: string): Promise<UserData | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId },
        });
        return user;
    } catch (error) {
        console.error('Error fetching user by Clerk ID:', error);
        return null;
    }
}

// メールアドレスでユーザーを取得
export async function getUserByEmail(email: string): Promise<UserData | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}

// 全ユーザーを取得
export async function getAllUsers(): Promise<UserData[]> {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users;
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
}

// ユーザー数を取得
export async function getUserCount(): Promise<number> {
    try {
        const count = await prisma.user.count();
        return count;
    } catch (error) {
        console.error('Error fetching user count:', error);
        return 0;
    }
} 