import { prisma } from './prisma';

export interface UserData {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    nickname?: string | null;
    age?: number | null;
    totalSteps: number;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface DinosaurData {
    id: string;
    name: string;
    level: number;
    experience: number;
    hunger: number;
    species: string;
    appearanceState: string;
    lastFed: Date;
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

// DinoWalk専用機能

// ユーザーの恐竜を取得
export async function getUserDinosaur(userId: string): Promise<DinosaurData | null> {
    try {
        const dinosaur = await prisma.dinosaur.findUnique({
            where: { userId },
        });
        return dinosaur;
    } catch (error) {
        console.error('Error fetching user dinosaur:', error);
        return null;
    }
}

// 恐竜を作成（初回ユーザー向け）
export async function createDinosaur(userId: string, name: string = "マイ恐竜"): Promise<DinosaurData | null> {
    try {
        const dinosaur = await prisma.dinosaur.create({
            data: {
                userId,
                name,
            },
        });
        return dinosaur;
    } catch (error) {
        console.error('Error creating dinosaur:', error);
        return null;
    }
}

// 歩数を更新し経験値を追加
export async function updateUserSteps(userId: string, newSteps: number): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return false;

        const addedSteps = Math.max(0, newSteps - user.totalSteps);
        const experience = addedSteps; // 1歩 = 1経験値

        // ユーザーの歩数更新
        await prisma.user.update({
            where: { id: userId },
            data: { totalSteps: newSteps },
        });

        // 恐竜の経験値更新
        const dinosaur = await prisma.dinosaur.findUnique({ where: { userId } });
        if (dinosaur) {
            const newExp = dinosaur.experience + experience;
            const newLevel = Math.floor(newExp / 100) + 1; // 100経験値で1レベル

            await prisma.dinosaur.update({
                where: { userId },
                data: {
                    experience: newExp,
                    level: newLevel,
                    appearanceState: newLevel > 10 ? "adult" : newLevel > 5 ? "child" : "baby"
                },
            });
        }

        // 歩行ログ作成
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.walkingLog.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
            update: {
                steps: newSteps,
                experience: experience,
            },
            create: {
                userId,
                date: today,
                steps: newSteps,
                experience: experience,
            },
        });

        return true;
    } catch (error) {
        console.error('Error updating user steps:', error);
        return false;
    }
}

// 恐竜にエサをあげる
export async function feedDinosaur(userId: string, nutritionValue: number = 20): Promise<boolean> {
    try {
        const dinosaur = await prisma.dinosaur.findUnique({ where: { userId } });
        if (!dinosaur) return false;

        const newHunger = Math.min(100, dinosaur.hunger + nutritionValue);

        await prisma.dinosaur.update({
            where: { userId },
            data: {
                hunger: newHunger,
                lastFed: new Date(),
            },
        });

        return true;
    } catch (error) {
        console.error('Error feeding dinosaur:', error);
        return false;
    }
}

// 恐竜の空腹度を時間経過で減少
export async function updateDinosaurHunger(userId: string): Promise<boolean> {
    try {
        const dinosaur = await prisma.dinosaur.findUnique({ where: { userId } });
        if (!dinosaur) return false;

        const now = new Date();
        const hoursSinceLastFed = (now.getTime() - dinosaur.lastFed.getTime()) / (1000 * 60 * 60);
        const hungerDecrease = Math.floor(hoursSinceLastFed * 2); // 1時間に2ポイント減少
        const newHunger = Math.max(0, dinosaur.hunger - hungerDecrease);

        if (hungerDecrease > 0) {
            await prisma.dinosaur.update({
                where: { userId },
                data: { hunger: newHunger },
            });
        }

        return true;
    } catch (error) {
        console.error('Error updating dinosaur hunger:', error);
        return false;
    }
} 