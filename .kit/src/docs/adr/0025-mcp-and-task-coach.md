# ADR-0025: MCP サーバーによるタスク参照・編集とタスクコーチ

- 状態: 承認
- 日付: 2026-11-01

## 背景

- Issue #7 では、vault-task の task board の状態を AI（Claude Code / Cursor など）から MCP 経由で参照・編集できるようにすることを求めている
- さらに、AI がユーザーのタスク状況（今日のボード、期限、Inbox、見積もりと実績、持ち越し回数、停滞タスクなど）を把握した上で、適切なアドバイスやタスクマネジメントを行えるようにしたい
- Issue #7 起票時はボードの状態がデイリーノートの frontmatter にあったため「所有の区分」が課題だったが、ADR-0020 でボードの状態は端末別の操作ログ（`board/<端末名>/YYYY-MM.jsonl`）に移った。残る所有の区分の論点は、`close_board` によるデイリーノート本文 `## Task board` 節の更新と、AI による助言・振り返りの記録先である

## 決定

### 配置と通信方式

- MCP サーバーを `packages/vault-task/cli/mcp.ts` に置き、`esbuild.config.mjs` の CLI ビルド対象に加えて `dist/mcp.mjs` に出力する（プラグイン本体 `main.js` には同梱しない）
- 外部依存（`@modelcontextprotocol/sdk` など）は追加せず、Node 標準モジュールのみで JSON-RPC 2.0 over stdio（MCP プロトコル）を実装する
- Vault の読み込みは既存の `readVault`（`cli/read-vault.ts`）と `TaskIndex`（`src/core/index.ts`）をそのまま使い、ツール呼び出しのたびに最新のファイルを読む

### 端末名と所有の区分

- AI からのボード操作ログ（`board/<端末名>/YYYY-MM.jsonl`）および worklog（`worklog/<端末名>/YYYY-MM.jsonl`）の書き込みには、AI 専用の端末名（既定値 `ai`、`--device=<名前>` で変更可）を使う。同じ PC 上で Obsidian と AI が同じ jsonl ファイルに同時追記して壊れるのを防ぐため
- デイリーノート（`daily/YYYY/MM/YYYY-MM-DD.md`）に対する AI の書き込みは次の 2 つだけを許可する（ハーネス `.claude/docs/adr/0007-note-format.md` の DailyNote 本文保護との整合）:
  1. `close_board` 実行時、未完了が 0 であることを検査した上で、本文の `## Task board` 節の要約を生成・更新する（`closeBoardNote` / `upsertSummary`）。既存の他の節は変更しない
  2. AI のアドバイスや振り返りを残すときは、デイリーノート本文の末尾にセクションを追記（append-only）する。既存の本文は変更・削除しない

### 提供する MCP ツール

1. **把握（読み取り）**
   - `get_overview(date?, available_minutes?)`: 指定日（既定は今日）のボード、負荷（見積もり合計 vs 使える時間）、期限切れ・期限が近い issue、Inbox 件数、revisit が来た waiting / delegated、未締めの過去ボード、記録中のタイマー、注意が必要な指標（持ち越し過多・停滞タスク）を 1 回で返す
   - `get_board(date?)`: その日のボード詳細（issue / routine、グループごとの並び、未完了、記録中のタイマー、締めたか）
   - `list_pending_boards(today?)`: 締めていない過去のボード一覧
   - `list_issues(query)`: 条件（status / priority / label / 期限 / Inbox / 文字列検索 / ソート）で絞った issue 一覧
   - `get_issue(id)`: issue の frontmatter、本文、親子関係、按分後の実績工数、持ち越し回数
   - `get_worklog_summary(from, to)`: 期間内のタスク別・日別の実績工数、記録中のタイマー、worklog の異常候補（`reviewWorklogs`）
   - `get_routine_stats(id?, days?)`: routine の実施状況と継続率（`routineResults`）
2. **判断材料（指標の計算: `src/core/ coach.ts` または `metrics.ts`）**
   - **今日の負荷**: ボード上の未完了タスク（issue + routine）の `estimated` 合計と、1 日の使える時間（引数 `available_minutes`、既定 240 分）の比較
   - **持ち越し回数**: 操作ログ内の `carry` 回数および `scheduled` の履歴から、複数回持ち越されている issue を抽出
   - **停滞タスク**: `in-progress` なのに一定日数（既定 3 日）worklog がない issue、または `waiting` / `delegated` で `revisit` を過ぎた issue
   - **見積もり精度**: 直近の closed issue における `estimated` と按分後実績（`effortMinutes`）の比率・差分
3. **介入（検査付きの編集）**
   - ボード操作: `add_to_board(date, issue_ids)`、`remove_from_board(date, issue_id)`、`move_card(date, id, group)`、`set_routine_result(date, routine_id, result)`、`reopen_board(date)`
     - 存在する issue / routine か、グループが `issue/board-groups.json` の `groupKeys` に含まれるかを検査してから `board/<device>/YYYY-MM.jsonl` に追記する
   - 持ち越し・片付け: `carry_issues(date, issue_ids, mode, reschedule_to?)`
     - `mode` は `"reschedule"` または `"inbox"`。issue の frontmatter（`scheduled` 等）を `reschedulePatch` / `inboxPatch` で更新し、ボードログに `carry` を追記する
   - ボードの締め: `close_board(date)`
     - 未完了が 0 でなければエラーにする。デイリーノートがなければ `newDailyContent` で作り、`closeBoardNote` で `## Task board` 要約を書いてから `close` を追記する
   - issue の作成・更新: `create_issue(summary, ...)`、`update_issue(id, fields)`
     - `parseIssue` / `canSetParent` / ラベル・メンバーの存在検査を通し、不正な値や循環する親を拒否する。status 変更時は `closePatch` / `cancelPatch` / `somedayPatch` の規則を適用する
   - タイマー操作: `start_timer(task_ids)`、`stop_timer(task_ids?)`
     - `worklog/<device>/YYYY-MM.jsonl` への開始行追記と、記録中エントリの停止（`stopWorklogLines`）を行う
   - デイリーノートへの助言追記: `append_daily_note(date, heading, content)`
     - デイリーノート本文の末尾に助言・振り返りセクションを追記する（既存行は一切変更しない）

### コーチ用スキル

- `.claude/skills/task-coach/SKILL.md` を新設し、朝（計画・負荷調整）・日中（優先度相談・リスケ）・夕（振り返り・未完了の carry・`close_board`・デイリーノートへの振り返り追記）・週次（Inbox 仕分け・停滞タスクと持ち越し常連の見直し）の対話手順と、1 日の使える時間の基準値（デフォルト 240 分、スキルまたは引数で調整可）を定める

## 理由

- 外部依存を追加せず Node 標準機能で stdio の JSON-RPC 2.0 を実装することで、サプライチェーンリスクを増やさずオフライン環境でもそのままビルド・実行できる
- `vault-task/cli/` に置けば、`readVault` や `src/core/` のスキーマ・ボード再生・工数按分・要約生成を重複なく共有でき、プラグインと MCP で判定結果がずれない
- 集計・指標計算を `src/core/` の純粋関数として実装し、1 回の `get_overview` で返すことで、AI が多数のファイルを個別に読んで計算間違いをするのを防げる
- AI 専用の端末名（`ai`）に分けることで、Obsidian 側の未同期ログとファイルが分かれ、Git マージや同時書き込みで競合しない

## 却下した案

- **`packages/vault-mcp` を別パッケージとして切り出す**: `vault-task` の `src/core/` と `cli/read-vault.ts` をほぼすべて参照するため、パッケージを分けると相対参照やビルド設定が重複する
- **`@modelcontextprotocol/sdk` を追加する**: stdio のツール公開だけであれば JSON-RPC 2.0 のメッセージ処理は 100 行程度で書けるため、多数の推移的依存を増やす必要がない
- **PC の Obsidian と同じ端末名を共有する**: 同じ PC で Obsidian と AI を同時に使ったとき、同じ jsonl ファイルへの同時書き込みや行置換が競合する

## 影響

- `packages/vault-task` に `src/core/metrics.ts`（指標計算）、`cli/ vault-writer.ts`（Node fs での検査付き書き込み）、`cli/mcp.ts`（MCP サーバー）が追加される
- `.claude/skills/task-coach/SKILL.md` が追加され、`CLAUDE.md` のスキル一覧から参照される
- `main.js`（Obsidian プラグイン本体）のバンドル内容は変わらない
