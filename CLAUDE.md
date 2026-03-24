# CLAUDE.md — Aibou

## Overview
AIが同僚になるセルフホスト型チャットツール。サーバー代+AI処理量だけで使える、中小企業向けチャット。

## Tech Stack
- Next.js（フロントエンド + API Routes）
- TypeScript
- Tailwind CSS
- WebSocket（リアルタイム通信）
- PostgreSQL（データベース）
- Claude API（AI機能）
- Docker Compose（セルフホスト配布）

## Directory Structure
（プロジェクト初期化後に更新）

## Development
- `npm run dev` — 開発サーバー起動
- `npm run build` — ビルド
- `npm run lint` — Lint実行

## Rules
- TypeScript を使用する
- コンポーネントは PascalCase
- 日本語UIテキスト
- データベーステーブル名・カラム名は snake_case
- WebSocket イベント名は `機能名:アクション名` 形式（例: `message:send`, `channel:join`）
