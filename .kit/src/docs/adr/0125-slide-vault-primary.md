# ADR-0125: 子の基本の色の primary を、スライドの既定の primary にする

- 状態: 承認
- 日付: 2026-11-12

## 背景

[Issue #125](https://github.com/yamayu-i/pkm-kit/issues/125)。[ADR-0121](0121-vault-theme.md) で子の Vault ごとに基本の色（`.kit-local/theme.json`）を変えられるようにしたが、生成済みのスライド（`slide/`）は対象外にした。スライドは Vault の外でも同じに見えるよう、ビルドが色の値を `index.html` に埋め込むためである。

その結果、primary を変えた子でも、新しく作ったスライドが上流の primary（紫）で作られる。デッキごとに `<meta name="deck-primary">`（[ADR-0117](0117-slides.md)）を書けば変えられるが、毎回書くのは手間で、書き忘れると Vault の色とそろわない。

## 決定

ADR-0121 の「対象外」のうち、スライドの primary だけを対象にする。

- `slide.mjs`（build / check / export / pdf / new）は、`.kit-local/theme.json` の `light.primary` / `dark.primary` を読み、`deck-primary` を書いていないデッキの既定の primary にする。デッキの `deck-primary` が先
- ダークの primary が書かれていなければ、`deck-primary` と同じく、ライトから作る（`lightenForDark`）
- 効かせる先: スライドの `--sl-primary` などの 4 色（`deck-primary` と同じ）と、閲覧の画面（バー・ボタン）の `--vt-primary`・`--vt-on-primary`・その半透明。閲覧の画面も Obsidian の中の色とそろえる。デッキの `deck-primary` は、これまでどおりスライドにだけ効く
- 面・文字の色は上流の値のまま。primary は上流のスライドの面との比 4.5:1 を確かめ（`derivePrimary`）、足りなければビルドを止めて、`theme.json` の値と、デッキだけ変える方法を出す（規則 `vault-primary`）
- 値はこれまでどおり `index.html` に埋め込む。`check` も同じ `theme.json` で作り直して比べるので、`theme.json` を変えると、すべての `index.html` が古いと止まる。`node .kit/bin/slide.mjs build --all` でビルドし直す。`theme.mjs build` は、`slide/` があればそれを知らせる
- `theme.json` の値の形と規約は、これまでどおり `theme.mjs check` が確かめる。スライドの CLI は primary の 2 つだけを読む

## 理由

- 子が primary を変えるのは Vault を見分けるため（ADR-0121）で、その Vault で作るスライドも同じ色であることが期待される
- 埋め込む方式を変えないので、ブラウザで開いても、外に共有（export / pdf）しても、作った Vault の色のまま見える
- 面と文字まで変えると、スライドのパターンごとのコントラストを子の色で確かめ直す必要があり、範囲が大きい。primary だけなら、`deck-primary` と同じ確かめ方で済む

## 却下した案

- **デッキを作るときに `deck-primary` を書き込む**: 作った後に `theme.json` を変えると、古い色が各デッキに残る。どれが Vault の色で、どれがデッキの意図した色か区別できない
- **`index.html` を Vault のスニペットから実行時に読ませる**: Vault の外（ブラウザ、共有したファイル）では色が変わり、スクリプトのない埋め込み（縮小の iframe）では読めない
- **面と文字の色も子の色にする**: 上の理由。必要になったら別に決める
- **`theme.mjs build` が `slide.mjs build --all` も実行する**: CLI どうしが依存し、`deck.html` に誤りのあるデッキがあると色の反映ごと失敗する。知らせて、スライドの検査（`verify.mjs`）で止める

## 影響

- 変更: `packages/slide`（`build.ts` の `vaultPrimary`、CLI が `theme.json` を読む。テスト）、`packages/design`（`theme.mjs build` の知らせ。テスト）、`.kit/bin/slide.mjs`・`.kit/bin/theme.mjs`（ビルドの成果物）、`design.md`、子向けのハーネスの文書（`docs/harness.md` の基本の色、`slide` スキルの authoring）、ADR-0121 の状態（一部置換）
- 子の Vault: 移行は要らない。`theme.json` で primary を変えている子は、取り込んだ後の `slide.mjs build --all`（vault-upgrade の手順）で、既存のスライドも Vault の primary になる。`.kit/changes/` に書く
- セキュリティ: 新しく読むのは Vault の中の `theme.json` だけ。値は `#RRGGBB` か確かめてから CSS に入れる
