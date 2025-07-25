This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# HTTPS開発サーバーの起動方法

## 基本的な方法

```bash
# HTTPS開発サーバーを起動
npm run dev:https

# 異なるポート（3001）でHTTPS開発サーバーを起動
npm run dev:https-port
```

## カメラ機能のために必要

カメラ機能（`getUserMedia` API）を使用するには、HTTPS接続が必要です：

- **HTTP (localhost:3000)**: カメラ機能が動作しない場合があります
- **HTTPS (https://localhost:3000)**: カメラ機能が正常に動作します

## ブラウザでの設定

### Chrome/Edge
1. https://localhost:3000 にアクセス
2. 「詳細設定」→「localhost に進む（安全ではありません）」をクリック
3. カメラの使用許可を求められたら「許可」をクリック

### Firefox  
1. https://localhost:3000 にアクセス
2. 「危険性を理解した上で接続するには」→「例外を追加」
3. カメラの使用許可を求められたら「許可」をクリック

## トラブルシューティング

### 証明書の警告が表示される場合
- これは自己署名証明書のため正常です
- 「詳細設定」から「安全ではないページに移動」を選択してください

### カメラが起動しない場合
1. HTTPSで接続していることを確認
2. ブラウザのカメラ権限を許可
3. 他のアプリケーションでカメラを使用していないか確認
4. ページを再読み込み

## 代替方法

Next.js 15の`--experimental-https`が動作しない場合：

```bash
# mkcertを使用したローカル証明書（推奨）
# 1. mkcertをインストール
winget install mkcert

# 2. ローカル CA を作成
mkcert -install

# 3. localhost の証明書を作成
mkcert localhost 127.0.0.1 ::1

# 4. 証明書を使用してサーバーを起動
# （カスタム設定が必要）
```

## 本番環境

本番環境では自動的にHTTPSが設定されるため、この設定は開発環境でのみ必要です。

---

# DinoWalk - 恐竜育成ウォーキングゲーム