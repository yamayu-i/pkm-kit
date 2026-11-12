# progress: 進み具合

目標に対する進み具合を、項目ごとに見せる。

## 使う場面

- いくつかの項目の、目標までの残りを見せるとき

## 使わない場面

- 項目どうしの量を比べる（[chart-bar](chart-bar.md)）
- 1 つの指標の今の値（[kpi](kpi.md)）

## ひな形

```html
<section data-pattern="progress">
  <h2>4 チームのうち、請求だけが移行を終えた</h2>
  <ul class="progress">
    <li class="hl" style="--v:100"><span class="label">請求</span><span class="value">100%</span></li>
    <li style="--v:60"><span class="label">契約</span><span class="value">60%</span></li>
    <li style="--v:20"><span class="label">技術</span><span class="value">20%</span></li>
    <li style="--v:0"><span class="label">解約</span><span class="value">0%</span></li>
  </ul>
</section>
```

## 書くときの指示

- `ul.progress` の `li` に `.label`・`.value`、進み具合を `style="--v:0〜100"`
- 言いたい項目に `hl`
- 4 項目まで

## よくある失敗

- 目標（100%）が何かを書かない（見出しか `.source` に書く）

## 根拠

[共通の規約](../conventions.md) の C8、C9。
