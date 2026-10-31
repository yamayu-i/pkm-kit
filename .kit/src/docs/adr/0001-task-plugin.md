# ADR-0001: タスク管理を自作プラグイン vault-task として作る

- 状態: 承認
- 日付: 2026-10-31

## 背景

タスク管理をこの Vault に乗せたい。コミュニティプラグインは使わない方針で、PC とモバイル（iOS / Android）の両方で使い、同期は自作の vault-git で行う。
ノートは人も LLM（Claude Code）も読み書きする。

## 決定

- 新しいプラグイン `vault-task` を `.plugin-src/packages/vault-task/` に作り、ビルド結果を `.obsidian/plugins/vault-task/` に出す（名前は仮）
- vault-git と同じく、Obsidian に依存しない層（スキーマ、索引、按分計算、整合性検査）と、Obsidian に依存する層（View、Modal、Vault への書き込み）を分ける
- Obsidian に依存しない層は CLI からも呼べるようにし、Claude Code のスキル（lint、worklog の見直しなど）から使う
- 作る順番:
  1. スキーマ、メモリ上の索引、lint 用の CLI
  2. issue のヘッダー UI、一括登録
  3. DailyTaskView（scheduled の一覧、グループなしのボード）、タイマー
  4. dead / caution の整理
  5. task group manager、カレンダーモーダル、分析

## 理由

- 同じロジックをプラグインと CLI で共有すると、Claude Code での編集と Obsidian での編集の結果がずれない
- group manager（自由なレイアウト、2 階層のネスト）は一番重いので、使い始めてから形を決める

## 影響

- ファイルの書き込みを伴う新しいプラグインなので、コミット前にセキュリティチェックの対象になる
