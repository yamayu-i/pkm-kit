# 0004: Vault の中の HTML を読み取り専用で表示するプラグイン vault-html を有効にする

## 何が変わったか

`.kit/src/docs/adr/0035-html-viewer.md`。

- 新しいプラグイン vault-html が、Vault の中の `.html` / `.htm` を Obsidian のタブで読み取り専用で表示する。ファイルエクスプローラーと Markdown リンクから開ける
- HTML の中のスクリプトは動かず、外部に通信しない（iframe の sandbox と CSP）。Vault の中の画像は出る
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）の `community-plugins.json` に `vault-html` が増えた

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `vault-html` を足す。ほかの要素と順は残す

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `community-plugins.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）
- 子の Vault が、`.html` を開く別のプラグインを入れている: vault-html の登録が失敗し、Obsidian の起動時に通知が出る。どちらを使うかをユーザーに確かめる（上流はコミュニティプラグインを使わない方針）

## 確かめ方（check.mjs）

- `community-plugins.json` に `vault-html` が入っている

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、vault-html が読み込まれ、`.html` がファイルエクスプローラーに出る。PC とスマホで HTML を開き、表示されること、編集できないこと、リンクを押すと Vault のノートは Obsidian で、外部のページはブラウザで開くことを確かめる。
