# MCP と task-coach

- 種類: MCP・手順（AI 経由）
- 開き方: Claude Code で task-coach のスキルを使う（「今日の計画を立てたい」「振り返りをしたい」など）。worklog の見直しは worklog-review
- 場面: [朝の計画](../jobs/task-plan-day.md)、[一日の締め](../jobs/task-close-day.md)、[週の見直し](../jobs/task-review-week.md)、[作業しながら残す](../jobs/task-work.md)

## 今の振る舞い

- MCP サーバー `pkm`（`.kit/bin/mcp.mjs`。Vault ルートの `.mcp.json` で登録する）が、ツールを群の接頭辞で分けて公開する。`--toolset` で群を選べる
  - `task_`: ボード・issue・worklog・routine を読み、検査を通して書く。AI の書き込みは端末名 `ai` の記録に入る。旧名（接頭辞なし）も 1 版のあいだ呼べる
  - `note_` / `daily_` / `wiki_`: ノートの検索（単純一致。全角・半角、カタカナ・ひらがなの違いを無視）、取得、一覧、リンク、デイリーノート、wiki の目次と記録、未取り込みの元資料（読み取りだけ）
  - `check_`: ノートの書式とタスク管理のデータの検査、改名の候補
  - `meta_feedback`: 足りなかったことを AI が記録する
- 起動中は索引をメモリに持ち、変わったファイルだけを読み直す。一覧は既定 20 件で、`task_get_overview` の問題と停滞は上位 5 件と件数
- 使われ方を `.claude/mcp-log/` に記録する（呼び出し、MCP を通さないノートの読み書き、フィードバック。本文は残さない）。harness-review が `usage-report.mjs` の集計を読み、上流で直すものを escalate する
- 把握: 今日の負荷（未完了の estimated の合計と、使える時間。既定 240 分）、期限切れ・期限が近い、Inbox の件数、締めていないボード、記録中のタイマー、持ち越し常連、停滞、見積もりの精度
- 介入: ボードの操作（載せる・外す・★ を付ける・並べ替える。サブイシューも合成キーで扱う）、持ち越し、締める、issue の作成と更新、タイマー、デイリーノートの末尾への追記
- task-coach は朝・日中・夕・週次の進め方を持ち、まとめて変えるときは対象を示して確かめてから行う
- AI からの status の変更には、取り消しのトーストは出ない

## 使う概念

[task board](../concepts/task-board.md)、[estimated と実績](../concepts/task-estimate.md)、[worklog とタイマー](../concepts/task-worklog.md)、[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0025](../../../../src/docs/adr/0025-mcp-and-task-coach.md)、[ADR-0156](../../../../src/docs/adr/0156-pkm-mcp.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、子向けの task-coach（`.claude/skills/task-coach/SKILL.md`）
