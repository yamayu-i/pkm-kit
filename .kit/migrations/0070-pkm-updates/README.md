# 0070: 一覧 View の前回からの変更を見るプラグイン pkm-updates を有効にし、リボンのボタンを pkm-ribbon にまとめる

## 何が変わったか

`.kit/src/docs/adr/0070-pkm-updates.md`。

- 新しいプラグイン pkm-updates の View「PKM Updates」が、一覧 View（Issues、Inbox、Organize、Scheduled、Someday、Routines、Members、Daily notes、Notes、Sources）ごとに、前回の確認より後に `updated` が新しくなったノートを出す。画面の下の Viewed で確認した日時を記録し、リストを空にする
- Viewed の記録は `updates/<端末名>/YYYY-MM.jsonl` に追記する（端末間で同期し、全端末の最も新しい日時を基準にする）。初めて Viewed を押したときにできる
- 自作プラグインのリボンのボタンは pkm-ribbon だけが出す。並びは 今日のデイリーノート → Daily → PKM Updates → issue をまとめて作成 → Git: pull → Git: push。PKM Updates のボタンに件数のバッジが付く
- 「テンプレートから新規ファイルを作成」のボタンはリボンからなくなった（コマンドは残る）
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）の `community-plugins.json` に `pkm-updates` が増えた

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `pkm-updates` を足す。ほかの要素と順は残す

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `community-plugins.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）
- 子の Vault が `updates/` を別の用途に使っている: Viewed の記録が混ざる。フォルダの名前を変えるかをユーザーに確かめ、上流に escalate する

## 確かめ方（check.mjs）

- `community-plugins.json` に `pkm-updates` が入っている

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、pkm-updates が読み込まれる。PC とスマホで次を確かめる。

- リボンのボタンが上の順に並び、PKM Updates のボタンに件数のバッジが付く（0 件なら出ない）
- PKM Updates を開くと一覧ペインに固定タブで開き、セクションの見出しを押すと、その一覧が一覧ペインに開く
- Viewed を押すとリストが空になり、ほかの端末で pull した後もそちらで空になる
