---
name: task-coach
description: ユーザーのタスク状況（ボード、期限、Inbox、見積もりと実績、持ち越し回数、停滞タスク）を MCP ツールで把握し、朝・日中・夕・週次のアドバイスとタスクマネジメントを行う手順。ユーザーが「今日の計画を立てたい」「タスクを整理したい」「ボードを締めたい」「振り返りをしたい」と言ったときに使う。
---

# タスクコーチ（task-coach）

pkm-task の MCP サーバー（`.kit/src/packages/pkm-task/cli/mcp.ts`。ADR-0025）を使い、ユーザーのタスク状況を把握した上でアドバイスとボード・issue の操作を行う。

## 前提と基準値

- **1 日の集中作業に使える時間（`available_minutes`）**: 既定 **240 分（4 時間）**。ユーザーが「今日は 2 時間しか取れない」などと言ったときは引数の `available_minutes` を上書きして負荷を計算する
- **estimated の `d` は 24 時間**（1440 分。ADR-0034）で、使える時間とは別。ユーザーが「1 日仕事」と言ったら `1d` ではなく使える時間ぶん（既定なら `4h`）で見積もりを提案する。`1d` 以上の見積もりは、負荷の計算で使える時間を大きく超えるので、分けるかどうかを確かめる
- **AI の端末名**: `ai`（`board/ai/YYYY-MM.jsonl`、`worklog/ai/YYYY-MM.jsonl`、`statuslog/ai/YYYY-MM.jsonl` に記録され、Obsidian 側のログファイルと衝突しない）
- **MCP サーバーの起動設定（Claude Code / Cursor）**:
  ```json
  {
    "mcpServers": {
      "pkm-task": {
        "command": "node",
        "args": [".kit/bin/mcp.mjs", ".", "--device=ai"]
      }
    }
  }
  ```

## 1. まず全体状況を掴む

最初に `get_overview` を 1 回呼ぶ。個別のファイルを先に読まない。

- `board`: 今日のボードに載っている issue・サブイシュー（`subs`）・routine、未完了、★（`stars`。今日の最重要、3 件まで）。欄ごとの並び（Working / Top 3 / Up next / Waiting / Done）は `get_board` の `lanes` で見る
- `workload`: 未完了の見積もり合計（`unfinishedEstimatedMinutes`）、未見積もり件数（`unestimatedCount`）、使える時間との比較（`overloadedByMinutes`、`loadRatio`）
- `dead` / `caution`: 期限切れ・期限間近の issue
- `scheduledNotOnBoard`: 今日が Calendar の日（`scheduled`。その日にやらなければならない日。ADR-0152）だがまだボードに載っていない issue の ID とサブイシューの合成キー（Obsidian で Today を開くと自動で載る。その日にボードから外したものは含まない）
- `pendingBoards`: 今日より前で締めていないボード
- `frequentlyCarried`: 2 回以上持ち越されている issue（分割・見直し候補）
- `stalled`: `in-progress` なのに直近 3 日以上 worklog がない issue、`revisit` が来た someday、`waiting` / `delegated`
- `estimation`: 直近の完了タスクの見積もりと実績の比率

## 2. 場面ごとの進め方

### 朝（1 日の計画・ボード編成）

1. `pendingBoards` があれば、昨日の未完了を片付けて、過去のボードを `close_board` で締めることを先に提案する。片付け方は `carry_issues` の `mode`: 今日もやる（`today`。日付を書かない）、Next に戻す（`next`）、その日に考え直す（`tickler` と `reschedule_to`）、その日にやらなければならない日を選び直す（`move` と `reschedule_to`。Calendar の日を持つものだけ）、Inbox に戻す（`inbox`）
2. `dead`（期限切れ）、`caution`（期限間近）、`scheduledNotOnBoard`（今日の Calendar）を提示し、今日やるべき候補を挙げる。Next（`list_issues` で open・`clarified`・Calendar の日も Tickler もないもの）から、文脈・時間・優先度で選ぶ（GTD の Engage。ADR-0150）
3. 今日やると決めたものは `add_to_board` で載せる。`scheduled` は書かない（Calendar はその日にやらなければならない日だけに使う。ADR-0152）。今日の最重要を 3 件まで選んで `star_card` で ★ を付け、やる順を `order_card` で並べる（並びは翌日以降にも引き継ぐ。★ はその日だけ）。サブイシューは合成キー（`i-12#k3f9a2`）で扱う
4. `workload.overloadedByMinutes > 0`（詰め込みすぎ）または `unestimatedCount > 0`（見積もりなし）なら指摘し、優先度の低いものを別日にリスケするか、見積もりを設定する（`update_issue`）よう提案する

### 日中（優先度の相談・割り込み対応）

1. 急ぎの差し込みタスクが発生したら `create_issue`（`add_to_board_date` 付き。今やると決めたなら `clarified: true`）で追加し、代わりに今日やらないタスクを `carry_issues` で Next に戻す（`next`）か Tickler にする提案をする
2. 作業を始める・切り替えるときは必要に応じて `start_timer` / `stop_timer` を使う

### 夕方・夜（振り返り・ボードの締め）

1. `get_board` と `get_worklog_summary`（今日の日付）で、今日完了したもの・未完了のもの・実績工数を確認する
2. 記録中のままのタイマーがあれば `stop_timer` で止めるか確認する
3. 未完了の routine があれば結果を聞き、`set_routine_result`（`closed` / `canceled`）で記録する
4. 未完了の issue があれば、Next に戻す・Tickler にする・Calendar の日を選び直す・Inbox に戻す、のどれにするかを聞き、`carry_issues` で片付ける
5. 未完了が 0 になったら `close_board` でボードを締め、デイリーノートの `## Task board` に要約を書き出す
6. 1 日の振り返りや翌日への申し送りをまとめ、`append_daily_note`（見出し例: `AI 振り返り`）でデイリーノート本文の末尾に追記する

### 週次（Inbox 仕分け・停滞タスクと持ち越し常連の見直し）

1. `get_overview` と `list_issues(inbox_only: true)` を呼ぶ。Inbox は「open で `clarified` でない issue」で、日付は見ない（締切だけある未整理の issue も入る）。整理できたら `update_issue` で `clarified: true` にする（日付を決めない次の行動なら日付は入れない）。曖昧に戻ったものは `clarified: false` で Inbox に戻す（日付は残る）
2. **持ち越し常連（`frequentlyCarried`）**: なぜ進まないのか（粒度が大きすぎる、前提条件が揃っていない、実はやらなくてよい）を一緒に確認し、サブイシューへの分割（`create_sub_issues` で親の md の中に足す。サブのサブは作れない）や `someday` / `canceled` への変更を提案する
3. **停滞タスク（`stalled.inProgressStale` / `revisitDue` / `waitingOrDelegated`）**: 状況を確認し、`status_detail` の更新や次アクションの設定を行う
4. **見積もり精度（`estimation`）**: 見積もりに対して実績が恒常的に膨らんでいないかを確認し、今後の見積もりの目安を調整する
5. 週次の振り返りを当日のデイリーノート末尾に `append_daily_note` で追記する

## 3. 守ること

- ボード操作・issue 更新・デイリーノートへの追記は、必ず MCP ツール（または `vault-ops.ts`）を通して検査付きで行う。手で `board/`・`worklog/`・`statuslog/` の jsonl、issue の frontmatter を直接書き換えない
- デイリーノート本文の既存の行は変更・削除しない（`close_board` による `## Task board` 節の更新と、`append_daily_note` による末尾追記のみ）
- 複数の issue をリスケ・ステータス変更するときやボードを締めるときは、対象をユーザーに示して確認してから実行する

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 朝・週次の計画と仕分けの提案 | 人 | 3 |
| 日中の相談への答え、夕方の振り返り | 人 | 2 |
