# Find and open a View

- 種類: コマンド（ダイアログ）
- 場面: [朝の計画](../jobs/task-plan-day.md)、[ノートを書き始める](../jobs/note-write.md)

## 今の振る舞い

- コマンド「Find and open a View」（pkm-view-selector。既定のホットキー Mod+K）で、一覧の View を探すダイアログが開く。スマホではコマンドパレットから呼ぶ
- 候補は pkm-task（Daily, Issues, Inbox, Organize, Scheduled, Someday, Routines, Board groups, Members, Labels, Tasks サイドバー）、pkm-template（Daily notes, Notes, Sources）、pkm-updates（PKM Updates）の View。View のアイコンとプラグイン名が付き、開いている View には「開いている」と出る
- 打った文字であいまいに絞り込む。大文字と小文字は区別しない（`issues` で Issues、`bg` で Board groups）。名前の先頭で当たるものが上に来る
- Enter で、その View を [一覧ペイン](layout-panes.md) に開く（各 View を開くコマンドと同じ）
- 片方のプラグインが無効なら、その View は出ない
- 「Markdown リンクを挿入」のホットキー（Obsidian の既定の Mod+K）は外してある。コマンドパレットからは使える

## 根拠

[ADR-0072](../../../../src/docs/adr/0072-view-selector.md)
