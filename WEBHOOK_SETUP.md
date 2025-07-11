# Clerk Webhook設定手順

## 1. 環境変数の設定

`.env`ファイルに以下の環境変数を追加してください：

```env
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

## 2. Clerk Dashboardでの設定

1. **Clerk Dashboard**にログインします
2. **Webhooks**セクションに移動します
3. **Add Endpoint**をクリックします
4. **Endpoint URL**に以下を入力します：
   ```
   https://your-domain.com/api/webhooks/clerk
   ```
   ローカル開発の場合は、ngrokなどを使用してローカルサーバーを公開してください：
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```

5. **Events**セクションで以下のイベントを選択します：
   - `user.created` - ユーザーが作成された時
   - `user.updated` - ユーザー情報が更新された時
   - `user.deleted` - ユーザーが削除された時

6. **Create**をクリックしてWebhookを作成します

7. 作成されたWebhookの詳細ページで**Signing Secret**をコピーします

8. コピーした**Signing Secret**を`.env`ファイルの`CLERK_WEBHOOK_SECRET`に設定します

## 3. ローカル開発でのテスト

ローカル開発環境でWebhookをテストする場合：

1. ngrokをインストールします：
   ```bash
   npm install -g ngrok
   ```

2. 別のターミナルでngrokを起動します：
   ```bash
   ngrok http 3000
   ```

3. ngrokから提供されるHTTPS URLを使用してClerk DashboardでWebhookを設定します

## 4. 動作確認

### 基本的な確認
1. ブラウザで以下のURLにアクセスして、エンドポイントが動作していることを確認：
   ```
   http://localhost:3000/api/webhooks/clerk
   ```
   正常に動作している場合、以下のような応答が返ります：
   ```json
   {
     "message": "Clerk Webhook endpoint is working",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "environment": "development",
     "hasWebhookSecret": true
   }
   ```

### Webhookのテスト
1. アプリケーションでユーザーがサインアップします
2. データベースの`User`テーブルに新しいレコードが作成されることを確認します
3. ユーザー情報を更新した場合、データベースのレコードも更新されることを確認します

## 5. トラブルシューティング

### デバッグ手順
1. **コンソールログを確認**
   - アプリケーションのコンソール出力を確認してください
   - Webhookが受信されているか、エラーが発生していないかチェックします

2. **Clerk Dashboardのログを確認**
   - Clerk Dashboardの**Webhook Logs**を確認してください
   - Webhookの送信状況とレスポンスを確認できます

3. **環境変数の確認**
   ```bash
   # 環境変数が設定されているか確認
   echo $CLERK_WEBHOOK_SECRET
   ```

### よくある問題と解決策

1. **Webhook verification failed**
   - `CLERK_WEBHOOK_SECRET`が正しく設定されているか確認
   - Clerk Dashboardの**Signing Secret**と一致しているか確認

2. **Missing svix headers**
   - Webhookが正しいエンドポイント（`/api/webhooks/clerk`）に送信されているか確認
   - Clerk Dashboardで設定したURLが正しいか確認

3. **Database errors**
   - Prismaクライアントの設定が正しいか確認
   - データベース接続が正常か確認
   - Userテーブルのスキーマが正しいか確認

4. **Authentication errors**
   - middlewareで`/api/webhooks/clerk`がpublicルートとして設定されているか確認

## 6. 本番環境での注意事項

- 本番環境では、Webhookエンドポイントが確実にHTTPS経由でアクセス可能であることを確認してください
- データベース接続の設定が本番環境用に正しく設定されていることを確認してください
- エラーハンドリングとログ記録が適切に設定されていることを確認してください
- セキュリティのため、本番環境では詳細なエラー情報をレスポンスに含めないように調整してください 