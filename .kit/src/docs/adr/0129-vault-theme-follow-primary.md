# ADR-0129: 基本の色の primary に、選んだものの面・primary の上の文字・HTML の閲覧画面・Mermaid を追従させる

- 状態: 承認
- 日付: 2026-11-12

## 背景

[Issue #129](https://github.com/yamayu-i/pkm-kit/issues/129)。[ADR-0121](0121-vault-theme.md) で、子の Vault は `.kit-local/theme.json` で基本の色を変えられるようになった。しかし primary だけを変えた子では、上流の紫が残る。

- `secondary-container` / `on-secondary-container`（ライト `#e8def8` / `#1d192b`、ダーク `#3d3749` / `#e8def8`）は M3 の基本の値で、primary に追従しない。使っている場所は、pkm-task の今の段階・一覧の選んだ行・ボードの落とせるグループ・on の絞り込みチップ、pkm-template の選んだチップ・今週の曜日、スライドの閲覧画面の押したボタン。pkm-template では枠が primary なので、新しい primary の枠の中に薄紫の面が出る
- `on-primary` のダーク（`#381e72`）も追従しない。新しい primary のボタンに、濃い紫の文字が載る。コントラストの検査は通るので止まらない。スライドの側（[ADR-0125](0125-slide-vault-primary.md) の `derivePrimary`）は白か暗い文字を自動で選ぶので、同じ Vault でもスライドと Obsidian で文字の色が違う
- `theme.json` にライトの primary しか書かないと、Obsidian のダークの primary は上流の紫のまま。スライドはライトから作るので、ここも食い違う
- pkm-html の閲覧画面は、上流の `tokens.css` をそのまま iframe に入れる。そのため Obsidian の中で開いた html は、primary も含めて上流の色のまま。ADR-0121 が対象外にしたのは書き出した html（`tmp/` の共有用）だけで、閲覧画面は決めていなかった
- Mermaid の配色は、`pkm-theme.css` に値で書かれていて、子のスニペット `pkm-theme-local.css` が上書きしない。面・文字・枠を変えた子では、図だけが上流の色になる

pkm-slide の一覧では、選んだ行の薄紫をやめて primary から作る色に替えた（ADR-0124）。ほかのプラグインは替えていない。

## 決定

### 1. primary を変えた子では、書いていない色を primary から作る

`theme.json` のモードごとに `primary` が書かれていて、次の色が書かれていなければ、`theme.mjs` が作る。書かれていれば、書いた値が先。

| 色 | 作り方 |
|---|---|
| `secondary-container` | そのモードの面（上書き後の `surface`）に primary を 16% 混ぜた色（スライドの `primary-container` と同じ） |
| `on-secondary-container` | そのモードの `on-surface`（上書き後） |
| `on-primary` | 白と、ライトの `on-surface` のうち、primary との比が高い方（スライドと同じ） |

- 上流の値（M3 の基本の値）は変えない。`theme.json` のない子と、primary を変えていない子は、見た目が変わらない
- 作り方は `tokens.json` に新しい拡張 `follow`（`{ "from": "{color.primary}", "rule": "container" | "on-container" | "on-color" }`）で書く。上流が色を足したときにも、どの色が primary に追従するかを同じ場所で決めるため。`derive`（同じ色の半透明。上流の値でも成り立つ）とは別にする。`follow` は上流の値では成り立たなくてよく、子が元の色を変えたときにだけ使う
- 作った色も、これまでどおり規約の検査（`contrast` と面の段差）を通す。外れたら、何も書かずに止まる。直し方として、その色を `theme.json` に書けばよいことを出す
- `derivePrimary` と `lightenForDark` は design パッケージの関数にまとめ、スライドと `theme.mjs` で共有する。スライドの閲覧画面とスライドが作る色は、`theme.json` に書いていない子では Obsidian と同じ値になる

### 2. ダークの primary がなければ、ライトから作る

`theme.json` にライトの `primary` だけが書かれていたら、ダークの `primary` は `lightenForDark`（ADR-0125 のスライドと同じ）で作る。そのあと 1. でダークの色を作る。

### 3. スライドの閲覧画面の押したボタンも追従させる

ADR-0125 の閲覧画面の上書き（`chromeRule`）に、`--vt-secondary-container` と `--vt-on-secondary-container` を足す。値は、スライドの `primary-container` と同じ作り方の色。

### 4. pkm-html の閲覧画面は、Obsidian で今効いている色を使う

iframe に入れる `--vt-*` の値を、Obsidian の `body` の計算済みの値（`getComputedStyle`）から作り、上流の `tokens.css` の後に重ねる。子のスニペットの色にも、ライト / ダークの切り替え（`css-change`）にも追従する。値は `--vt-*` の名前と、CSS の値として安全な文字だけを通す。書き出し（`tmp/` に共有用に書く html）は、これまでどおり上流の値（ADR-0121）。

### 5. Mermaid も子のスニペットで上書きする

`pkm-theme-local.css` に、Mermaid のルールも書く。モードごとに、Mermaid が使う色（面・文字・枠・色相）のどれかが上流と変わっていれば、そのモードの Mermaid のルールを、上書き後の値で `html body.theme-*` のセレクタで書く。生成には `pkm-theme.css` と同じ関数を使う。

### 変えないもの

- closed の status の紫、図とスライドの `purple` の色。色相は意味を持つ（ADR-0121）
- 書き出した html、図（pkm-diagram が描く SVG と PNG）、スライドの面と文字。値を埋め込むもので、ADR-0121 / 0125 のまま

## 理由

- 子が primary を変えるのは、Vault を見分けるため（ADR-0121）。選んだものの面と primary の上の文字は、M3 でも primary と同じ色の系統から作る色で、primary だけが変わって残るのは名残でしかない
- 上流の値を変えずに「子が変えたときにだけ作る」にすると、上流と既存の子の見た目を変えずに済み、プラグインの CSS（7 か所）も直さなくてよい
- 作り方をスライドと共有すれば、同じ Vault の中で、Obsidian・スライド・閲覧画面の色が食い違わない
- 閲覧画面は Obsidian の中の画面なので、Obsidian と同じ色であるのが自然。計算済みの値を読めば、theme.json の CLI と同じ結果を二重に持たずに済む

## 却下した案

- **プラグインの CSS を、primary の半透明と枠に置き換える**（pkm-slide の一覧と同じ）: 上流の見た目も変わる。選んだ行・絞り込みチップが今より弱く見え、7 か所それぞれで見え方を確かめ直す必要がある
- **上流の `secondary-container` などの値も、作り方の式に合わせる**: `derive` と同じく上流でも式が成り立つので単純になるが、全 Vault の見た目が変わる。M3 の基本の値から離れる理由がない
- **作らずに、`theme.mjs` が「secondary-container も書くとよい」と知らせるだけにする**: 子が毎回自分で色を選ぶことになり、選ばなければ名残が残る
- **閲覧画面に、`pkm-theme-local.css` のファイルを読んで入れる**: スニペットを読み解く処理が要り、プラグインの `body` の上書きと二重になる。計算済みの値なら、どこで上書きされても同じに扱える

## 影響

- 変更: `packages/design`（`tokens.json` の `follow`、読み込み、`theme.ts`、primary の関数、Mermaid の生成、テスト、`design-tokens.md` の「Vault」の列）、`packages/slide`（共有の関数を使う、`chromeRule`、テスト）、`packages/pkm-html`（閲覧画面、テスト）、`.kit/bin/theme.mjs`・`.kit/bin/slide.mjs`・`.obsidian/plugins/pkm-html/`（ビルドの成果物）、`design.md`、子向けのハーネスの文書（`docs/harness.md` の基本の色）、ADR-0121 / 0125 の状態（一部置換）
- 子の Vault: `theme.json` で primary を変えている子は、取り込んだ後に `pkm-theme-local.css` を作り直す必要がある（作り直すまで `verify.mjs` が止まる）。移行で `theme.mjs build` を実行する。スライドも `slide.mjs build --all`（vault-upgrade の手順）で作り直す。`.kit/changes/` に書く
- セキュリティ: 閲覧画面に入れる値が増える。値は Obsidian の計算済みの CSS 変数で、名前と値を確かめてから入れる。セキュリティチェックの対象にする
