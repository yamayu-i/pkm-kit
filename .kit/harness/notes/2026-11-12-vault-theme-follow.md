# 2026-11-12 基本の色の primary への追従（#129）

## 食い違い

- 起きたこと: ADR-0129 を承認にした後、実装の途中で 2 点を詰めて、承認済みの ADR の本文を書き換えた。1 つはダークの primary の作り方で、`lightenForDark` をダークの面との比だけで見ると、surface-container-high とホバーを重ねた面で 4.5:1 を割るため、規約を満たす最初の色に変えた。もう 1 つは閲覧画面でのスライドの扱い（primary の系統だけを今の値にする）。ADR の README は「承認済みの ADR は書き換えない」としているが、同じ PR の中でまだマージしていない ADR を詰めるときの扱いは、dev-plan にも dev-implement にも書かれていない
- 改善案: dev-implement の「計画から外れるとき」に、まだマージしていない同じ PR の ADR は、本文を直して PR の本文に書けばよい（マージした ADR は新しい ADR にする）と書く

- 起きたこと: pkm-html の閲覧画面は `tokens.css` を iframe の `body` に入れるので、スライドが `:root` に埋め込んだ閲覧画面の色（ADR-0125 の `chromeRule`）は、Obsidian の中では `body` の値に負けて効いていなかった。ADR-0125 は Obsidian の中の見え方を確かめていない。今回、閲覧画面に primary の系統の今の値を入れたので、Obsidian の中でも Vault の primary になった
- 改善案: スライドの CLI と pkm-html の閲覧画面の両方に関わる変更では、ブラウザで開いたときと Obsidian の閲覧画面の両方の見え方を、ADR の影響に書く

## 移行

- 起きたこと: 移行 0129 の古い形（primary だけの `theme.json` と古いスニペット）を、fixture README のとおり `customized` に足したところ、0058 のテストが `appearance.json` の値をそのまま比べていて失敗した。fixture に足すと、ほかの移行のテストの期待も変わる。結局、0129 のテストの中だけで古い形を書いた
- 改善案: fixture README に「ほかの移行のテストが値を比べているファイルに触れる古い形は、その移行のテストの中で書いてよい」と書く

- 起きたこと: 移行が上流の CLI（`.kit/bin/theme.mjs`）を使うのは初めてで、`migrations.test.mjs` の `childFrom` は `.kit/migrate.mjs` と `.kit/migrations/` しか写さなかった。`theme.mjs` を写す行を足した。移行から CLI を呼んでよいかは、移行の書き方に書かれていない
- 改善案: 移行の書き方に「移行は `.kit/bin/` の CLI を `process.execPath` で呼んでよい（子には上流から届いている）。テストで使うなら `childFrom` で写す」と書く
