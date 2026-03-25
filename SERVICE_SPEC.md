# Aibou - サービス仕様書

## 1. サービス概要
- **一言で**: メールもチャットもAIも、1つに。月額固定の中小企業向けコミュニケーションハブ
- **対象ユーザー**: Slack/Chatworkのユーザー課金に不満を持つ中小企業（5〜100名規模）
- **解決する課題**:
  - チャットツールのユーザー課金モデル（社員が増えるほどコスト増）
  - 社内チャットと外部連絡（税理士・社労士等）の分断
  - AI契約を別途必要とする現状
- **コアバリュー**: サーバー代+AI処理量だけで、チャット・メール統合・AIアシスタントが使える
- **ステータス**: MVP

## 2. ユーザーロールと権限
| ロール | できること |
|---|---|
| Admin | ワークスペース管理、ユーザー招待/削除、チャンネル管理、メール連携設定、AI設定 |
| Member | チャンネル参加、メッセージ送受信、DM、メール返信、AIへの指示、ファイル共有 |
| Guest | 招待されたチャンネルのみ参加、閲覧・投稿 |
| 外部メール参加者 | アカウント不要。メールでチャンネルに参加（送受信） |
| AI Bot | 全チャンネル常駐、メッセージ要約、タスク実行、質問応答（予定） |

## 3. 機能一覧
### 実装済み
- [x] リアルタイムメッセージング（Socket.io）
- [x] チャンネル管理（public / private）
- [x] ユーザー認証（JWT + bcrypt）
- [x] 招待制サインアップ（招待リンク発行・受理）
- [x] メンバー一覧パネル（オンライン/オフライン）
- [x] メール受信→チャンネル表示（IMAPポーリング）
- [x] チャンネル→メール返信（SMTP送信）
- [x] 外部連絡先の自動登録（メール送信者をExternalContactとして管理）
- [x] メール連携設定UI（IMAP/SMTP設定、接続テスト、Gmailプリセット）
- [x] セルフホスト用 Docker Compose（PostgreSQL）

### 未実装（予定）
- [ ] AI Bot 常駐（Claude API — 全チャンネル自動参加）
- [ ] AI 要約（チャンネルの要点を自動生成）
- [ ] AI タスク実行（チャットからの指示でアクション実行）
- [ ] AI ナレッジベース（過去チャット+メールの構造化・検索）
- [ ] ダイレクトメッセージ（1対1 / グループDM）
- [ ] ファイルアップロード・共有
- [ ] メッセージ検索・履歴
- [ ] スレッド（メッセージへの返信）
- [ ] リアクション（絵文字リアクション）
- [ ] メンション・通知（Push / メール）
- [ ] 外部連絡先管理UI（表示名編集等）
- [ ] メール添付ファイルサポート
- [ ] 専用メールアドレス自動生成（channel-abc@mail.aibou.app）

## 4. 画面一覧
| 画面 | パス | 対象ロール | 概要 |
|---|---|---|---|
| ログイン | `/login` | 全員 | メール+パスワード認証 |
| サインアップ | `/signup` | 新規ユーザー | ワークスペース作成+アカウント登録 |
| 招待参加 | `/invite/:token` | 招待済みユーザー | 招待リンクからの登録 |
| ホーム（チャット） | `/` | Member+ | サイドバー+チャンネル+メッセージ+メンバーパネル |
| メール設定モーダル | — | Admin | チャンネルへのIMAP/SMTP接続設定 |
| メール返信モーダル | — | Member+ | チャンネルからのメール返信フォーム |
| チャンネル作成モーダル | — | Member+ | 新規チャンネル作成 |
| 招待モーダル | — | Admin | 招待リンク生成・コピー |

## 5. データモデル
### テーブル一覧
- `users` — ユーザー情報（メールBotシステムユーザー含む）
  - 主要フィールド: id, email, display_name, avatar_url, role, created_at
- `workspaces` — ワークスペース（マルチテナント対応）
  - 主要フィールド: id, name, slug, owner_id, created_at
- `workspace_members` — ワークスペース参加者
  - 主要フィールド: workspace_id, user_id, role, joined_at
- `invites` — 招待リンク（7日間有効）
  - 主要フィールド: id, workspace_id, token, expires_at, used_at
- `channels` — チャンネル
  - 主要フィールド: id, workspace_id, name, description, is_private, created_by
- `channel_members` — チャンネル参加者
  - 主要フィールド: channel_id, user_id, joined_at, last_read_at
- `messages` — メッセージ（チャット+メール統合）
  - 主要フィールド: id, channel_id, user_id, content, thread_id, is_ai, created_at
- `reactions` — リアクション
  - 主要フィールド: id, message_id, user_id, emoji
- `direct_messages` — DM部屋
  - 主要フィールド: id, workspace_id, created_at
- `dm_members` — DM参加者
  - 主要フィールド: dm_id, user_id
- `files` — アップロードファイル
  - 主要フィールド: id, message_id, filename, url, size, mime_type
- `ai_summaries` — AI要約
  - 主要フィールド: id, channel_id, summary, period_start, period_end, token_count
- `channel_email_configs` — チャンネルメール連携設定
  - 主要フィールド: id, channel_id, imap_host/port/user/pass, smtp_host/port/user/pass, email_address, is_active, last_sync_uid
- `external_contacts` — 外部メール連絡先（アカウント不要）
  - 主要フィールド: id, workspace_id, email, display_name
- `email_messages` — メール固有情報（messages と 1:1）
  - 主要フィールド: id, message_id, email_message_id, subject, from_email, to_emails, direction (INBOUND/OUTBOUND)

## 6. 外部連携
- 認証: 自前実装（JWT / jose + bcryptjs）
- DB: PostgreSQL（Prisma v7 ORM）
- リアルタイム通信: Socket.io（別ポート3001）
- メール受信: IMAP（imapflow）— 30秒ポーリング
- メール送信: SMTP（nodemailer）
- AI: Claude API（予定）
- ホスティング: セルフホスト（Docker Compose）、将来的にマネージドサービス提供

## 7. ビジネスルール
- ワークスペースは招待制。Adminが招待リンクを発行（有効期限7日）
- サインアップ時にワークスペース + #general + #random チャンネルが自動作成
- メール連携設定はAdmin限定。IMAP/SMTPパスワードはAES-256-GCMで暗号化保存
- 外部メール送信者はExternalContactとして自動登録（アカウント作成不要）
- メール経由のメッセージは「メールBot」システムユーザー経由でDB保存
- メール返信時、In-Reply-To/Referencesヘッダでスレッド追跡
- AI Botは全publicチャンネルに自動参加（予定）。privateチャンネルはAdmin設定で制御
- ファイルアップロード上限: 10MB/ファイル（設定変更可能）
- メッセージ履歴: 無制限（サーバーストレージ依存）

## 8. 非機能要件
- 想定ユーザー数: 初期は社内5〜10人、将来的に1ワークスペースあたり100人
- パフォーマンス目標: メッセージ送信後100ms以内に配信
- メール取り込み: 30秒間隔（MAIL_POLL_INTERVAL で設定可能）
- セキュリティ: JWT認証、WebSocket認証、HTTPS必須、パスワードハッシュ化（bcrypt）、メール設定暗号化（AES-256-GCM）

## 9. 既知の課題・制限
- 初期は社内利用。マルチテナントのマネージドサービスは将来対応
- 外部Slackワークスペースへの直接参加は不可（Slackプロトコルの制約）
- モバイルアプリは初期スコープ外（PWA対応で代替）
- メール添付ファイルは未対応（本文テキストのみ取り込み）
- IMAPポーリング方式のため、メール受信にはポーリング間隔分の遅延あり

## 10. 更新履歴
| 日付 | 内容 |
|---|---|
| 2026-03-24 | 初版作成 |
| 2026-03-25 | チャット基盤実装（WebSocket、認証、チャンネル管理、招待機能） |
| 2026-03-25 | メール連携実装（IMAP受信→チャンネル表示、チャンネル→SMTP返信） |
| 2026-03-25 | サービス概要を「コミュニケーションハブ」に更新、メール関連仕様追記 |
