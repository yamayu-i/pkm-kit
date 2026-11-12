# deck.html の書き方

`slide/<…>/<デッキ>/deck.html` は HTML の断片。スクリプトと値（色・大きさ）を持たず、決まった部品のクラスだけで書く。ビルド（`node .kit/bin/slide.mjs build`）が、共通の CSS とスクリプトを入れた `index.html` にする。

## 全体の形

```html
<title>問い合わせの初回応答を縮める</title>
<meta name="deck-density" content="present">
<meta name="deck-author" content="サポート企画">
<meta name="deck-date" content="2026-11-11">

<section data-pattern="cover">
  <h1>…</h1>
</section>

<section data-pattern="assertion-evidence">
  <p class="kicker">2. 原因</p>
  <h2>見出しは主張の文</h2>
  <figure>…</figure>
  <p class="source">出典: …</p>
  <aside class="notes">話すこと</aside>
</section>
```

| 設定（`<meta name="…" content="…">`） | 値 | 既定 |
|---|---|---|
| `deck-density` | `present`（話して投影する）/ `read`（読んでもらう） | `present` |
| `deck-theme` | `light` / `dark`（開いたときのテーマ。画面で切り替えられる） | `light` |
| `deck-primary` | アクセントの色（`#RRGGBB`）。値を書いてよいのはここだけ。面との比が 4.5:1 に足りないとビルドが失敗する | トークンの primary |
| `deck-primary-dark` | ダークのときのアクセントの色。省くと `deck-primary` から作る | — |
| `deck-author`、`deck-date` | 一覧の上に出す | — |
| `deck-lang` | `<html lang>` | `ja` |

## 1 枚の形

1 枚は `<section data-pattern="<パターンの id>">`。直下に置くものは次のとおり。

| 要素 | 役割 |
|---|---|
| `<p class="kicker">` | 見出しの上の小さい文字（章の名前など）。見出しの前に置く。なくてよい |
| `<h2>`（表紙は `<h1>`） | 見出し。必ず 1 つ |
| `<p class="lead">` | 見出しのすぐ後に置くと、見出しの補足になる。本文の中に置くと、その場所の大きめの文になる |
| それ以外 | 本文。パターンのひな形に従う |
| `<p class="source">` | 出典。下の端に出る。数字とグラフには必ず付ける |
| `<aside class="notes">` | 発表者ノート。スライドには出ない（一覧の「Notes」と発表者ビューに出る） |

ページ番号は自動で付く。

## 部品

どのパターンでも使える。配置はパターンの CSS が決めるので、ひな形から大きく離れない。

| 部品 | 書き方 |
|---|---|
| 列 | `<div class="cols">` の直下の要素が、同じ幅で横に並ぶ。`cols arrow` は間に矢印 |
| カード | `<div class="card">`。中に `<h3>`、`<p>`、`<ul>`。色のクラスを足せる |
| ラベル | `<p class="chip">`（カードの上の短い札） |
| 大きい数字 | `<p class="big">72<span class="unit">%</span></p>` |
| 強調 | `<strong>`（太字）、`<mark>`（色の面。1 枚に 1 か所） |
| 弱い文字 | `class="muted"` |
| リスト | `<ul>` / `<ol>`。4 項目・2 段まで |
| 図 | `<figure>` に `<img>` か `<svg>`、任意で `<figcaption>` |
| 図の上の説明 | `<aside class="callout" style="--x:40;--y:25">`（`<figure>` の中。位置は左上からの %） |
| 表 | `<table>`。数は `class="num"`、強調は `class="hl"`（行かセル） |
| 引用 | `<blockquote><p>…</p><cite>…</cite></blockquote>` |
| コード | `<pre><code>…</code></pre>`。強調する行を `<mark>` で囲む |
| 定義 | `<dl><dt>言葉</dt><dd>意味</dd></dl>` |

パターン専用の部品（`.agenda`、`.takeaways`、`.actions`、`.matrix`、`.layers`、`.tree`、`.steps`、`.timeline`、`.cycle`、`.funnel`、`.bars`、`.share`、`.kpi`）は、各パターンのひな形にある。

### 色

色は名前のクラスで付ける: `primary`（アクセント）、`green`、`blue`、`purple`、`gray`、`sky`、`pink`、`red`、`amber`。カード・層・手順・帯・SVG の箱に付けられる。

- 値（`#…`、`rgb()`）、`style` の色、`<font>` は書けない（ビルドがエラーにする）
- 1 枚で使う色は、アクセント 1 つと無彩色を基本にする。意味のある区別（良い / 悪い、前 / 後）のときだけ 2 色（[規約](conventions.md) の C6、C8）
- `style` に書けるのは、部品のつまみだけ: `--v`（棒・帯・絞り込みの量）、`--x` / `--y`（説明の位置）

### ステップ（1 つずつ出す）

`data-step` を付けた要素は、Slide Show で → を押すたびに 1 つずつ出る。一覧・PDF・スクリプトなしの表示では、すべて出ている。

```html
<li data-step>1 つ目</li>
<li data-step>2 つ目</li>
<div class="card" data-step="2">2 つ目と同時に出る</div>
```

- 数を書かなければ、文書の順に 1 つずつ。同じ数を書くと同時に出る
- 話す順に見せたいときだけ使う。付けないことは違反ではない（[規約](conventions.md) の C10 と注意書き）

### 図とグラフ

- **SVG を直接書く**（[diagram](patterns/diagram.md)、[chart-line](patterns/chart-line.md)）: `viewBox` の幅を 1600 にする（文字が規約の大きさになる）。クラスは `box`、`edge`、`arrowhead`、`axis`、`grid`、`line`、`dot`、`bar`、`small`、`hl` と色の名前。`fill` / `stroke` / `font-size` の値を書かない
- **D2 で描く**: ノードが多い構成図は、[diagram](../diagram/SKILL.md) の手順で SVG にし、デッキのフォルダに置いて `<img src="arch.svg" alt="…">` で参照する
- **棒・内訳・絞り込み**は CSS の部品（`.bars`、`.share`、`.funnel`）で書く。SVG にしない
- Mermaid は使えない（スクリプトが要るため）

### 添付

画像は**デッキのフォルダ**に置き、相対パスで参照する（`<img src="photo.jpg" alt="何が写っているか">`）。`asset/` や、ほかのデッキのフォルダを参照しない。外部の URL の画像は使えない。フォルダの中にサブフォルダを作ってよい（`img/photo.jpg`）。

## 目で確かめる

ビルドが通っても、はみ出しと重なりは機械では分からない。ブラウザ（Playwright）がある環境では、渡す前に画像にして見る。

```js
// node で実行する。1 枚ずつ、ステップをすべて出した状態で撮る
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (let n = 1; n <= 12; n++) {
  await page.goto(`file:///<Vault の絶対パス>/slide/<フォルダ>/index.html#/${n}`);
  await page.reload();
  await page.addStyleTag({ content: ".sl-show .slide [data-step]{opacity:1!important;transform:none!important}" });
  await page.screenshot({ path: `tmp/slide-check/${String(n).padStart(2, "0")}.png` });
}
await browser.close();
```

見るところ: 文字や図がスライドの枠・カードの枠からはみ出していないか。見出しが 3 行以上になっていないか。文字が重なっていないか。強調が見出しの言っていることと合っているか。ブラウザがなければ、ユーザーに「目では確かめていない」と伝える。

## 置き場所の決まり

- `slide/` の下に、デッキごとのフォルダ。整理のために入れ子にしてよい（`slide/team/onboarding/`）。フォルダ名は英小文字・数字・ハイフン
- `deck.html` があるフォルダが 1 つのデッキ。デッキの中にデッキを作らない
- `slide/` に md を置かない。`index.html` を手で編集しない（`node .kit/bin/slide.mjs check` が見つける）
- ノートからは `[題](slide/<フォルダ>/index.html)` でリンクしてよい
