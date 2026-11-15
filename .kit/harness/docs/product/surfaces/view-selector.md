# Find and open a View

- 種類: コマンド（ダイアログ）
- 場面: [朝の計画](../jobs/task-plan-day.md)、[ノートを書き始める](../jobs/note-write.md)

## 今の振る舞い

- コマンド「Find and open a View」（pkm-view-selector。既定のホットキー Mod+K）で、一覧の View を探すダイアログが開く。スマホではコマンドパレットから呼ぶ
- 候補は pkm-task（Daily, Issues, Inbox, Organize, Scheduled, Someday, Routines, Members, Labels, Tasks サイドバー）、pkm-template（Daily notes, Notes, Sources）、pkm-updates（PKM Updates）の View。View のアイコンとプラグイン名が付き、開いている View には「開いている」と出る
- 打った文字であいまいに絞り込む。大文字と小文字は区別しない（`issues` で Issues、`bg` で Board groups）。名前の先頭で当たるものが上に来る
- Enter で、その View を [一覧ペイン](layout-panes.md) に開く（各 View を開くコマンドと同じ）
- 片方のプラグインが無効なら、その View は出ない
- 「Markdown リンクを挿入」のホットキー（Obsidian の既定の Mod+K）は外してある。コマンドパレットからは使える

## 根拠

[ADR-0072](../../../../src/docs/adr/0072-view-selector.md)

## 入力と制約

有効なコマンドと View の登録から候補を集めます。検索語で候補を絞り、開いているものを示します。

## 操作と保存

選んだ View のコマンドを呼び出すだけで、ノートやタスクを変更しません。

## 失敗時と戻し方

候補がない場合は対応するプラグインの有効化、検索に当たらない場合は名前を確認します。

## 端末の違い

PC は Mod+K、上下キーと Enter。スマホはコマンドから開いて候補をタップします。
