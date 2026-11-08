# Capture issues

- 種類: コマンド（モーダル）
- 開き方: コマンド、リボンの「Capture issues」、[Tasks サイドバー](task-sidebar.md) のボタン。ホットキーは Obsidian で割り当てる
- 場面: [思いつきの捕捉](../jobs/task-capture.md)

## 今の振る舞い

- テキストエリア 1 つ。1 行 1 件（summary だけ）。空行は無視し、行頭の `- `・`* `・`- [ ] `・`1. ` は取り除く
- 「N 件作成します」と件数が出る。Enter は改行、Mod+Enter で作成（スマホはボタン）
- 作った issue はすべて Inbox に入る。5 秒のトースト「N 件の issue を作成しました（i-12〜i-14）」に、すべてタブで開くボタン

## 使う概念

[issue](../concepts/task-issue.md)、[Inbox](../concepts/task-inbox.md)

## 根拠

[ADR-0011](../../../../src/docs/adr/0011-quick-capture.md)
