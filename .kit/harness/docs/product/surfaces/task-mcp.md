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
- 把握: 今日の負荷（未完了の estimated の合計と、使える時間。既定 240 分）、期限切れ・期限が近い、Inbox の件数、記録中のタイマー、持ち越し常連、停滞、見積もりの精度
- 介入: ボードの操作（載せる・外す・★ を付ける・並べ替える。サブイシューも合成キーで扱う）、持ち越し、締める、issue の作成と更新、タイマー、デイリーノートの末尾への追記
- task-coach は朝・日中・夕・週次の進め方を持ち、まとめて変えるときは対象を示して確かめてから行う
- AI からの status の変更には、取り消しのトーストは出ない

## 使う概念

[task board](../concepts/task-board.md)、[estimated と実績](../concepts/task-estimate.md)、[worklog とタイマー](../concepts/task-worklog.md)、[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0025](../../../../src/docs/adr/0025-mcp-and-task-coach.md)、[ADR-0156](../../../../src/docs/adr/0156-pkm-mcp.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、子向けの task-coach（`.claude/skills/task-coach/SKILL.md`）

## 入力と制約

タスクは ID、サブは親 ID と sub の ID の組で指定します。依頼の曖昧な日付や作業の 1 日を、勝手に Calendar や 24 時間へ変換しません。

## 操作と保存

AI は MCP のツールで素のファイルを読み書きします。相談の提案だけでは保存されず、選択した操作で初めて状態が変わります。

## 失敗時と戻し方

エラーの対象 ID・不正なフィールド・不足の条件を確認します。曖昧な依頼は対象と期待する結果を明らかにし、結果を読み直して重複操作を防ぎます。

## 端末の違い

Claude Code の PC 上の操作です。スマホからは Obsidian の対応する画面で同じ正本を使います。


## 操作の例

「今日の残りを確認して、次にやる 2 件を相談したい」と頼む。AI は get_overview と get_board で状況を読み、提案する。選んだ後に add_to_board で載せ、get_board で結果を確認する。相談しただけでは Calendar の日を書かない。

存在しない ID で get_issue を呼んだ場合は、list_issues で対象を調べ直す。create_issue を繰り返す前には Inbox を読み、すでに作ったものを重複して作らない。
