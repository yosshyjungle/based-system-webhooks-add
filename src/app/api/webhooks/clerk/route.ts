import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// デバッグ用のGETエンドポイント
export async function GET() {
    console.log('GET request received at /api/webhooks/clerk');
    return NextResponse.json({
        message: 'Clerk Webhook endpoint is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET
    });
}

export async function POST(req: NextRequest) {
    console.log('=== POST request received at /api/webhooks/clerk ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    // Webhookの署名を検証するためのシークレット
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('CLERK_WEBHOOK_SECRET is not set');
        return NextResponse.json(
            { error: 'CLERK_WEBHOOK_SECRET is not configured' },
            { status: 500 }
        );
    }

    console.log('WEBHOOK_SECRET configured:', WEBHOOK_SECRET.substring(0, 10) + '...');

    // Webhookのヘッダーを取得
    const headerPayload = req.headers;
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    console.log('Svix Headers:', {
        svix_id: svix_id ? svix_id.substring(0, 10) + '...' : null,
        svix_timestamp,
        svix_signature: svix_signature ? svix_signature.substring(0, 20) + '...' : null
    });

    // ヘッダーが存在しない場合はエラー
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('Missing svix headers:', { svix_id: !!svix_id, svix_timestamp: !!svix_timestamp, svix_signature: !!svix_signature });
        return NextResponse.json(
            { error: 'Missing svix headers' },
            { status: 400 }
        );
    }

    // Webhookのペイロードを取得
    let payload;
    try {
        payload = await req.json();
        console.log('Payload type received:', payload?.type);
        console.log('Payload data keys:', payload?.data ? Object.keys(payload.data) : 'no data');
    } catch (error) {
        console.error('Error parsing JSON payload:', error);
        return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
        );
    }

    const body = JSON.stringify(payload);
    console.log('Body length:', body.length);

    // Webhookを作成
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Webhookを検証
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as any;
        console.log('Webhook verification successful');
    } catch (err) {
        console.error('Error verifying webhook:', err);
        console.error('Error details:', {
            message: (err as Error).message,
            name: (err as Error).name
        });
        return NextResponse.json(
            { error: 'Webhook verification failed', details: (err as Error).message },
            { status: 400 }
        );
    }

    // イベントタイプを取得
    const eventType = evt.type;
    console.log('Processing webhook event:', eventType);

    try {
        if (eventType === 'user.created') {
            console.log('Processing user.created event');
            // ユーザーが作成された時の処理
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;

            const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);

            console.log('Creating user with data:', {
                clerkId: id,
                email: primaryEmail?.email_address,
                firstName: first_name,
                lastName: last_name
            });

            // Prismaのユーザーテーブルにデータを追加
            const newUser = await prisma.user.create({
                data: {
                    clerkId: id,
                    email: primaryEmail?.email_address || '',
                    firstName: first_name || null,
                    lastName: last_name || null,
                    imageUrl: image_url || null,
                },
            });

            console.log('User created in database successfully:', newUser.id);
        } else if (eventType === 'user.updated') {
            console.log('Processing user.updated event');
            // ユーザーが更新された時の処理
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;

            const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);

            console.log('Updating user with clerkId:', id);

            // Prismaのユーザーテーブルを更新
            const updatedUser = await prisma.user.update({
                where: { clerkId: id },
                data: {
                    email: primaryEmail?.email_address || '',
                    firstName: first_name || null,
                    lastName: last_name || null,
                    imageUrl: image_url || null,
                },
            });

            console.log('User updated in database successfully:', updatedUser.id);
        } else if (eventType === 'user.deleted') {
            console.log('Processing user.deleted event');
            // ユーザーが削除された時の処理
            const { id } = evt.data;

            console.log('Deleting user with clerkId:', id);

            // Prismaのユーザーテーブルからデータを削除
            await prisma.user.delete({
                where: { clerkId: id },
            });

            console.log('User deleted from database successfully:', id);
        } else {
            console.log('Unhandled event type:', eventType);
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        console.error('Error stack:', (error as Error).stack);
        return NextResponse.json(
            {
                error: 'Error processing webhook',
                details: (error as Error).message,
                eventType: eventType
            },
            { status: 500 }
        );
    } finally {
        // Prismaクライアントを適切に終了
        await prisma.$disconnect();
    }

    console.log('Webhook processed successfully for event:', eventType);
    return NextResponse.json({
        message: 'Webhook processed successfully',
        eventType: eventType,
        timestamp: new Date().toISOString()
    });
} 