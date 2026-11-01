---
name: task-coach
description: ユーザーのタスク状況（ボード、期限、Inbox、見積もりと実績、持ち越し回数、停滞タスク）を MCP ツールで把握し、朝・日中・夕・週次のアドバイスとタスクマネジメントを行う手順。ユーザーが「今日の計画を立てたい」「タスクを整理したい」「ボードを締めたい」「振り返りをしたい」と言ったときに使う。
---

# タスクコーチ（task-coach）

vault-task の MCP サーバー（`.plugin-src/packages/vault-task/cli/mcp.ts`。ADR-0023）を使い、ユーザーのタスク状況を把握した上でアドバイスとボード・issue の操作を行う。

## 前提と基準値

- **1 日の集中作業に使える時間（`available_minutes`）**: 既定 **240 分（4 時間）**。ユーザーが「今日は 2 時間しか取れない」などと言ったときは引数の `available_minutes` を上書きして負荷を計算する
- **AI の端末名**: `ai`（`board/ai/YYYY-MM.jsonl`、`worklog/ai/YYYY-MM.jsonl` に記録され、Obsidian 側のログファイルと衝突しない）
- **MCP サーバーの起動設定（Claude Code / Cursor）**:
  ```json
  {
    "mcpServers": {
      "vault-task": {
        "command": "node",
        "args": [".plugin-src/packages/vault-task/dist/mcp.mjs", ".", "--device=ai"]
      }
    }
  }
  ```

## 1. まず全体状況を掴む

最初に `get_overview` を 1 回呼ぶ。個別のファイルを先に読まない。

- `board`: 今日のボードに載っている issue / routine、未完了、グループ配置
- `workload`: 未完了の見積もり合計（`unfinishedEstimatedMinutes`）、未見積もり件数（`unestimatedCount`）、使える時間との比較（`overloadedByMinutes`、`loadRatio`）
- `dead` / `caution`: 期限切れ・期限間近の issue
- `scheduledNotOnBoard`: 今日が実行日だがまだボードに載っていない issue
- `pendingBoards`: 今日より前で締めていないボード
- `frequentlyCarried`: 2 回以上持ち越されている issue（分割・見直し候補）
- `stalled`: `in-progress` なのに直近 3 日以上 worklog がない issue、`revisit` が来た someday、`waiting` / `delegated`
- `estimation`: 直近の完了タスクの見積もりと実績の比率

## 2. 場面ごとの進め方

### 朝（1 日の計画・ボード編成）

1. `pendingBoards` があれば、昨日の未完了を今日に移す（`carry_issues` で `reschedule`）か Inbox に戻して、過去のボードを `close_board` で締めることを先に提案する
2. `dead`（期限切れ）、`caution`（期限間近）、`scheduledNotOnBoard`（今日の予定）を提示し、今日やるべき候補を挙げる
3. ユーザーの合意を得て `add_to_board` でボードに載せ、`move_card` でグループ（午前 / 午後など）に配置する
4. `workload.overloadedByMinutes > 0`（詰め込みすぎ）または `unestimatedCount > 0`（見積もりなし）なら指摘し、優先度の低いものを別日にリスケするか、見積もりを設定する（`update_issue`）よう提案する

### 日中（優先度の相談・割り込み対応）

1. 急ぎの差し込みタスクが発生したら `create_issue`（`add_to_board_date` 付き）で追加し、代わりに今日やらないタスクを `carry_issues` で明日以降へ移す提案をする
2. 作業を始める・切り替えるときは必要に応じて `start_timer` / `stop_timer` を使う

### 夕方・夜（振り返り・ボードの締め）

1. `get_board` と `get_worklog_summary`（今日の日付）で、今日完了したもの・未完了のもの・実績工数を確認する
2. 記録中のままのタイマーがあれば `stop_timer` で止めるか確認する
3. 未完了の routine があれば結果を聞き、`set_routine_result`（`closed` / `canceled`）で記録する
4. 未完了の issue があれば、明日以降へリスケするか Inbox に戻すかを聞き、`carry_issues` で片付ける
5. 未完了が 0 になったら `close_board` でボードを締め、デイリーノートの `## Task board` に要約を書き出す
6. 1 日の振り返りや翌日への申し送りをまとめ、`append_daily_note`（見出し例: `AI 振り返り`）でデイリーノート本文の末尾に追記する

### 週次（Inbox 仕分け・停滞タスクと持ち越し常連の見直し）

1. `get_overview` と `list_issues(inbox_only: true)` を呼ぶ
2. **持ち越し常連（`frequentlyCarried`）**: なぜ進まないのか（粒度が大きすぎる、前提条件が揃っていない、実はやらなくてよい）を一緒に確認し、子 issue への分割（`create_issue` で `parent` 指定）や `someday` / `canceled` への変更を提案する
3. **停滞タスク（`stalled.inProgressStale` / `revisitDue` / `waitingOrDelegated`）**: 状況を確認し、`status_detail` の更新や次アクションの設定を行う
4. **見積もり精度（`estimation`）**: 見積もりに対して実績が恒常的に膨らんでいないかを確認し、今後の見積もりの目安を調整する
5. 週次の振り返りを当日のデイリーノート末尾に `append_daily_note` で追記する

## 3. 守ること

- ボード操作・issue 更新・デイリーノートへの追記は、必ず MCP ツール（または `vault-ops.ts`）を通して検査付きで行う。手で `board/` や `worklog/` の jsonl、issue の frontmatter を直接書き換えない
- デイリーノート本文の既存の行は変更・削除しない（`close_board` による `## Task board` 節の更新と、`append_daily_note` による末尾追記のみ）
- 複数の issue をリスケ・ステータス変更するときやボードを締めるときは、対象をユーザーに示して確認してから実行する
