---
name: task-coach
description: ユーザーのタスク状況（ボード、期限、Inbox、見積もりと実績、持ち越し回数、停滞タスク）を MCP ツールで把握し、朝・日中・夕・週次のアドバイスとタスクマネジメントを行う手順。ユーザーが「今日の計画を立てたい」「タスクを整理したい」「ボードを締めたい」「振り返りをしたい」と言ったときに使う。
---

# タスクコーチ（task-coach）

PKM の MCP サーバー `pkm`（`.kit/src/packages/pkm-task/cli/mcp.ts`。ADR-0025、ADR-0156）の `task_` の群を使い、ユーザーのタスク状況を把握した上でアドバイスとボード・issue の操作を行う。

## 前提と基準値

- **1 日の集中作業に使える時間（`available_minutes`）**: 既定 **240 分（4 時間）**。ユーザーが「今日は 2 時間しか取れない」などと言ったときは引数の `available_minutes` を上書きして負荷を計算する
- **estimated の `d` は 24 時間**（1440 分。ADR-0034）で、使える時間とは別。ユーザーが「1 日仕事」と言ったら `1d` ではなく使える時間ぶん（既定なら `4h`）で見積もりを提案する。`1d` 以上の見積もりは、負荷の計算で使える時間を大きく超えるので、分けるかどうかを確かめる
- **AI の端末名**: `ai`（`board/ai/YYYY-MM.jsonl`、`worklog/ai/YYYY-MM.jsonl`、`statuslog/ai/YYYY-MM.jsonl` に記録され、Obsidian 側のログファイルと衝突しない）
- **MCP サーバーの起動設定（Claude Code / Cursor）**: Vault ルートの `.mcp.json`（セットアップが置く）。旧名（`get_overview` など接頭辞なし）も 1 版のあいだ呼べるが、接頭辞付きの名前を使う
  ```json
  {
    "mcpServers": {
      "pkm": {
        "command": "node",
        "args": [".kit/bin/mcp.mjs", ".", "--device=ai"]
      }
    }
  }
  ```

## 1. まず全体状況を掴む

最初に `task_get_overview` を 1 回呼ぶ。個別のファイルを先に読まない。

- `board`: 今日のボードに載っている issue・サブイシュー（`subs`）・routine、未完了、★（`stars`。今日の最重要、4 件まで）。欄ごとの並び（Working / Top 4 / Up next / Watch / Done）は `task_get_board` の `lanes` で見る。Watch（`watch`）はボードに載っているかによらず、waiting / delegated の issue とサブすべて
- `workload`: 未完了の見積もり合計（`unfinishedEstimatedMinutes`）、未見積もり件数（`unestimatedCount`）、使える時間との比較（`overloadedByMinutes`、`loadRatio`）
- `dead` / `caution`: 期限切れ・期限間近の issue
- `scheduledNotOnBoard`: 今日が Calendar の日（`scheduled`。その日にやらなければならない日。ADR-0152）だがまだボードに載っていない issue の ID とサブイシューの合成キー（Obsidian で Today を開くと自動で載る。その日にボードから外したものは含まない）
- `frequentlyCarried`: 2 回以上持ち越されている issue（分割・見直し候補）
- `stalled`: `in-progress` なのに直近 3 日以上 worklog がない issue、`revisit` が来た someday、`waiting` / `delegated`（それぞれ上位 5 件。件数は `stalledCounts`。全件は `task_list_issues` で取る）
- `problems`: タスク管理のデータの問題（上位 5 件。件数は `problemCount`。全件は `check_vault` の `tasks`）
- `estimation`: 直近の完了タスクの見積もりと実績の比率

## 2. 場面ごとの進め方

### 朝（1 日の計画・ボード編成）

1. 締めていない過去のボードは催促しない（締めは記録だけ。ADR-0189）。昨日の未完了は Next に残っているので、2 の候補に含めて選ぶ
2. `dead`（期限切れ）、`caution`（期限間近）、`scheduledNotOnBoard`（今日の Calendar）を提示し、今日やるべき候補を挙げる。Next（`task_list_issues` の各 issue の `list` が `next` のもの。open・`clarified`・Calendar の日も Tickler もないもの。Tickler の日を迎えた計画済みの Project も含む。ADR-0210）から、文脈・時間・優先度で選ぶ（GTD の Engage。ADR-0150）。`project: true`（サブを持つ issue）は親を選ばず、Next のサブを選ぶ
3. 今日やると決めたものは `task_add_to_board` で載せる。`scheduled` は書かない（Calendar はその日にやらなければならない日だけに使う。ADR-0152）。今日の最重要を 4 件まで選んで `task_star_card` で ★ を付け、やる順を `task_order_card` で並べる（並びは翌日以降にも引き継ぐ。★ はその日だけ）。サブイシューは合成キー（`i-12#k3f9a2`）で扱う。載せるサブは、親が Next で、今日が期間（`start`〜`end`）に入るものにする。期間がないか今日が期間の外のサブは、勝手に期間を書かず、期間を決めるかをユーザーに提案する（ADR-0203）
4. `workload.overloadedByMinutes > 0`（詰め込みすぎ）または `unestimatedCount > 0`（見積もりなし）なら指摘し、優先度の低いものを別日にリスケするか、見積もりを設定する（`task_update_issue`）よう提案する

### 日中（優先度の相談・割り込み対応）

1. 急ぎの差し込みタスクが発生したら `task_create_issue`（`add_to_board_date` 付き。今やると決めたなら `clarified: true`）で追加し、代わりに今日やらないタスクを `task_carry_issues` で Next に戻す（`next`）か Tickler にする提案をする
2. 作業を始める・切り替えるときは必要に応じて `task_start_timer` / `task_stop_timer` を使う

### 夕方・夜（振り返り・ボードの締め）

1. `task_get_board` と `task_get_worklog_summary`（今日の日付）で、今日完了したもの・未完了のもの・実績工数を確認する
2. 記録中のままのタイマーがあれば `task_stop_timer` で止めるか確認する
3. 未完了の routine があれば結果を聞き、`task_set_routine_result`（`closed` / `canceled`）で記録する。`task_get_overview` の `missedRoutines`（予定日に結果を付けなかった積み残し）があれば、どの日の分かを示して結果を聞き、`date` にもとの日を入れて記録する（ADR-0206）
4. 未完了の issue は、片付けたいものだけ `task_carry_issues` で片付ける（Next に戻す `next`・Tickler にする `tickler`（open だけ）・Calendar の日を選び直す `move`）。やらなかったものは Next に残るので、全部を片付けなくてよい。Inbox に戻す mode はない（GTD では in に戻さない。ADR-0189）
5. `task_close_board` でボードを締め、デイリーノートの `## Task board` に要約を書き出す。未完了が残っていても締められ、未完了は持ち越しと書かれる
6. 1 日の振り返りや翌日への申し送りをまとめ、`task_append_daily_note`（見出し例: `AI 振り返り`）でデイリーノート本文の末尾に追記する

### 週次（Inbox 仕分け・Someday・停滞タスクと持ち越し常連の見直し）

1. `task_get_overview` と `task_list_issues(inbox_only: true)` を呼ぶ。Inbox は「open で `clarified` でない issue」で、日付は見ない（締切だけある未整理の issue も入る）。整理できたら `task_update_issue` で `clarified: true` にする（日付を決めない次の行動なら日付は入れない）。Inbox に戻す（`clarified: false`）のは、誤って整理済みにした open の issue の訂正だけ。行動が曖昧になったものは、その場で次の行動を決め直す（題を直す・サブに分ける）か、考え直す日を Tickler にする（ADR-0189）。Inbox の Project のサブには期間を入れられない（先に整理する）。Project に Tickler を付けるときは、閉じていないサブの期間の始まりのいちばん早い日以前にする。Project を someday にするとサブの期間と Calendar の日が消えるので、ユーザーに確かめてから `clear_sub_periods: true` を付ける（ADR-0210）
2. **持ち越し常連（`frequentlyCarried`）**: なぜ進まないのか（粒度が大きすぎる、前提条件が揃っていない、実はやらなくてよい）を一緒に確認し、サブイシューへの分割（`task_create_sub_issues` で親の md の中に足す。サブのサブは作れない）や `someday` / `canceled` への変更を提案する
3. **停滞タスク（`stalled.inProgressStale` / `revisitDue` / `waitingOrDelegated`）**: 状況を確認し、`status_detail` の更新や次アクションの設定を行う
4. **Someday**: `task_list_issues(statuses: ["someday"])` で取り、`reviewed` が古い順（未設定が先）に見る。Organize には revisit を迎えたものしか出ないので、ほかはここで見直す。続けるなら `status: "open"`（Inbox に戻る）、日付を決めるなら `tickler`、やめるなら `canceled`、残すなら `reviewed` を今日にする（思い出したい日があれば `revisit`）。件数が多ければ古いものから数件に絞って提案する（ADR-0212）
5. **見積もり精度（`estimation`）**: 見積もりに対して実績が恒常的に膨らんでいないかを確認し、今後の見積もりの目安を調整する
6. 週次の振り返りを当日のデイリーノート末尾に `task_append_daily_note` で追記する

## 3. 守ること

- MCP のツールで足りずにファイルを直接読み書きしたとき、結果が使えなかったときは `meta_feedback` で記録する（[ノートの書式と配置](../../docs/vault-conventions.md#mcp)）
- ボード操作・issue 更新・デイリーノートへの追記は、必ず MCP ツール（または `vault-ops.ts`）を通して検査付きで行う。手で `board/`・`worklog/`・`statuslog/` の jsonl、issue の frontmatter を直接書き換えない
- デイリーノート本文の既存の行は変更・削除しない（`task_close_board` による `## Task board` 節の更新と、`task_append_daily_note` による末尾追記のみ）
- 複数の issue をリスケ・ステータス変更するときやボードを締めるときは、対象をユーザーに示して確認してから実行する
- status は遷移表にある遷移でしか変えられない（in-progress から open に戻す、waiting と delegated を直接行き来する、などはできない。`task_update_issue` がエラーで移れる先を返す）。待ちから戻す先は in-progress（ADR-0183）

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 朝・週次の計画と仕分けの提案 | 人 | 3 |
| 日中の相談への答え、夕方の振り返り | 人 | 2 |
