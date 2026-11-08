## 変更の要約

- **移行 0070-pkm-updates**: 新しいプラグイン **PKM Updates**（`pkm-updates`）を有効にした。View「PKM Updates」が、一覧 View（Issues、Inbox、Organize、Scheduled、Someday、Routines、Members、Daily notes、Notes、Sources）ごとに、前回の確認より後に `updated` が新しくなったノートを 1 ページに出す（無限スクロール）。下に固定した Viewed で確認した日時を記録し、リストを空にする。セクションの見出しは、その一覧を一覧ペインに開く（ADR-0070）
- Viewed の記録は `updates/<端末名>/YYYY-MM.jsonl` に追記する。端末間で同期し、全端末の最も新しい日時を基準にする（初めて押したときにできる）
- 自作プラグインのリボンのボタンは、すべて **PKM Ribbon** が決まった順に出すようにした: 今日のデイリーノート → Daily → PKM Updates → issue をまとめて作成 → Git: pull → Git: push。PKM Updates のボタンに件数のバッジ（100 件以上は 99+、0 件は出ない）が付く
- 「テンプレートから新規ファイルを作成」のボタンをリボンからなくした（コマンドとホットキーは残る）
- 子への影響: 移行 0070 を実行する。`.obsidian/plugins/pkm-updates/` が増え、`pkm-ribbon` に `styles.css` が増えた。各端末で Obsidian を開き直し、リボンの並びとバッジ、PKM Updates の表示と Viewed を確かめる（モバイルも）
