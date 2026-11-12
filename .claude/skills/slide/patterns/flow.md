# flow: 分かれ道

はい / いいえで分かれる判断の流れを見せる。

## 使う場面

- 1〜2 回の判断で行き先が分かれる流れ

## 使わない場面

- 判断が 3 回以上、または行き先が合流する（[diagram](diagram.md) で SVG に描く）
- 分かれない手順（[process](process.md)）

## ひな形

```html
<section data-pattern="flow">
  <h2>分類が分かる件だけを、自動で振り分ける</h2>
  <div class="flow">
    <p class="node">問い合わせが届く</p>
    <p class="node q">分類が分かる？</p>
    <div class="branches">
      <div><p class="edge">はい（9 割）</p><p class="node primary">自動で担当を決める</p></div>
      <div><p class="edge">いいえ（1 割）</p><p class="node">リーダーが決める</p></div>
    </div>
  </div>
</section>
```

## 書くときの指示

- 上から順に `.node`。問いの `.node` に `q`。分かれ道は `.branches` の中に、`.edge`（条件）と `.node` を組にして 2 つ
- 分かれ道は 1 回までを勧める

## よくある失敗

- 分かれた先でさらに分ける（入らない。[diagram](diagram.md)）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C9（条件は線のそばに書く）。
