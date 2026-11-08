# 0007: テンプレートの設定を上流で固定する

## 何が変わったか

`.kit/src/docs/adr/0039-fixed-template-config.md`。

- テンプレートの設定（表示順、新規作成モーダルに出すか、生成先フォルダ、初期ファイル名パターン）は、上流の `.kit/templates/config.json` だけで決める。子の `template/config.json` は読まない
- vault-template の設定タブをなくした
- テンプレートの中身（`template/file/<type>.md`）は今までどおり使う。同じ名前なら子のものを優先し、子だけのテンプレートは一覧の末尾に出る（生成先は Vault ルート、ファイル名は入力したタイトル）

## スクリプトが行うこと（migrate.mjs）

- `template/config.json` を消す。書かれていた値（0001 のあとは上流と違う値だけ）を、捨てる値として挙げる
- `template/` が空になれば、`template/` も消す

## スクリプトで扱えない場合（AI が行うこと）

`check.mjs` が `template/config.json` を読めないと言って止まったとき（JSON として読めない、`templates` 配列がない、`file` のない項目がある）。人が編集中に壊した可能性が高いので、勝手に消さない。中身をユーザーに見せ、消してよいかを確かめてから消し、`node .kit/migrate.mjs` をもう一度実行する。

## 確かめ方（check.mjs）

- `template/config.json` がない

## 取り込んだ後（人が行うこと）

- 移行の出力に「捨てる値」があれば、ユーザーに伝える。上流の既定と違う生成先や表示順を使っていたので、それが既定に戻る
- 子だけのテンプレートに生成先が要るなら、その type を上流に足すよう escalate で伝える
