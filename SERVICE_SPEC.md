# Aibou - サービス仕様書

## 1. サービス概要
- **一言で**: AIが同僚になるセルフホスト型チャットツール
- **対象ユーザー**: Slack/Chatworkのユーザー課金に不満を持つ中小企業
- **解決する課題**: チャットツールのユーザー課金モデル（社員が増えるほどコスト増）と、別途AI契約が必要な現状を解消。サーバー代+AI処理量だけで、チャットもAIアシスタントも使える環境を提供する
- **ステータス**: MVP

## 2. ユーザーロールと権限
| ロール | できること |
|---|---|
| Admin | ワークスペース管理、ユーザー招待/削除、チャンネル管理、AI設定、システム設定 |
| Member | チャンネル参加、メッセージ送受信、DM、AIへの指示、ファイル共有 |
| Guest | 招待されたチャンネルのみ参加、閲覧・投稿 |
| AI Bot | 全チャンネル常駐、メッセージ要約、タスク実行、質問応答 |

## 3. 機能一覧
### 実装済み
（なし — 新規プロジェクト）

### 未実装（予定）
- [ ] リアルタイムメッセージング（WebSocket）
- [ ] チャンネル管理（public / private）
- [ ] ダイレクトメッセージ（1対1 / グループDM）
- [ ] ファイルアップロード・共有
- [ ] メッセージ検索・履歴
- [ ] ユーザー認証・招待制サインアップ
- [ ] AI Bot 常駐（全チャンネル自動参加）
- [ ] AI 要約（チャンネルの要点を自動生成）
- [ ] AI タスク実行（チャットからの指示でアクション実行）
- [ ] AI ナレッジベース（過去チャットの構造化・検索）
- [ ] メンション・通知（Push / メール）
- [ ] スレッド（メッセージへの返信）
- [ ] リアクション（絵文字リアクション）
- [ ] セルフホスト用 Docker Compose

## 4. 画面一覧
| 画面 | パス | 対象ロール | 概要 |
|---|---|---|---|
| ログイン | `/login` | 全員 | メール+パスワード認証 |
| サインアップ | `/signup` | 招待済みユーザー | 招待リンクからの登録 |
| ホーム | `/` | Member+ | チャンネル一覧、最近のアクティビティ |
| チャンネル | `/channel/:id` | Member+ | メッセージ表示・送信 |
| DM | `/dm/:id` | Member+ | ダイレクトメッセージ |
| スレッド | `/channel/:id/thread/:messageId` | Member+ | スレッド表示 |
| 検索 | `/search` | Member+ | メッセージ全文検索 |
| AI ダッシュボード | `/ai` | Member+ | AI要約・ナレッジベース |
| 管理画面 | `/admin` | Admin | ユーザー管理、チャンネル管理、AI設定 |

## 5. データモデル
### テーブル一覧
- `users` — ユーザー情報
  - 主要フィールド: id, email, display_name, avatar_url, role, created_at
- `workspaces` — ワークスペース（マルチテナント対応）
  - 主要フィールド: id, name, slug, owner_id, created_at
- `channels` — チャンネル
  - 主要フィールド: id, workspace_id, name, description, is_private, created_by
- `messages` — メッセージ
  - 主要フィールド: id, channel_id, user_id, content, thread_id, created_at, updated_at
- `channel_members` — チャンネル参加者
  - 主要フィールド: channel_id, user_id, joined_at, last_read_at
- `direct_messages` — DM部屋
  - 主要フィールド: id, workspace_id, created_at
- `dm_members` — DM参加者
  - 主要フィールド: dm_id, user_id
- `files` — アップロードファイル
  - 主要フィールド: id, message_id, filename, url, size, mime_type
- `ai_summaries` — AI要約
  - 主要フィールド: id, channel_id, summary, period_start, period_end, created_at

## 6. 外部連携
- 認証: 自前実装（JWT）
- DB: PostgreSQL
- リアルタイム通信: WebSocket
- AI: Claude API
- ホスティング: セルフホスト（Docker Compose）、将来的にマネージドサービス提供

## 7. ビジネスルール
- ワークスペースは招待制。Adminが招待リンクを発行
- AI Botは全publicチャンネルに自動参加。privateチャンネルはAdmin設定で制御
- AIの処理はトークン消費として記録し、ダッシュボードで可視化
- ファイルアップロード上限: 10MB/ファイル（設定変更可能）
- メッセージ履歴: 無制限（サーバーストレージ依存）

## 8. 非機能要件
- 想定ユーザー数: 初期は社内5〜10人、将来的に1ワークスペースあたり100人
- パフォーマンス目標: メッセージ送信後100ms以内に配信
- セキュリティ: JWT認証、WebSocket認証、HTTPS必須、パスワードハッシュ化（bcrypt）

## 9. 既知の課題・制限
- Phase 1 は社内利用のみ。マルチテナントは Phase 2 以降
- 外部Slackワークスペースへの直接参加は不可（Slackプロトコルの制約）
- モバイルアプリは初期スコープ外（PWA対応で代替）

## 10. 更新履歴
| 日付 | 内容 |
|---|---|
| 2026-03-24 | 初版作成 |
