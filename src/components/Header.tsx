'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

export default function Header() {
  const { user } = useUser();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ・タイトル */}
          <div className="flex items-center space-x-2">
            <div className="text-xl md:text-2xl">💬</div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              チャットアプリ
            </h1>
          </div>

          {/* 認証ボタン */}
          <div className="flex items-center space-x-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm md:text-base">
                  🔐 ログイン
                </button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <div className="flex items-center space-x-3">
                {/* ユーザー情報 */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">こんにちは、</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.firstName || user?.username || 'ユーザー'}
                  </span>
                </div>
                
                {/* ユーザーボタン（プロフィール・ログアウト） */}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 md:w-10 md:h-10",
                      userButtonPopoverCard: "shadow-lg border border-gray-200",
                      userButtonPopoverActionButton: "text-gray-700 hover:text-gray-900",
                    },
                  }}
                  showName={false}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
} 