# heatmap: 濃淡の表

2 つの軸の交わりの多い少ないを、濃淡で見せる。

## 使う場面

- 曜日 × 時間、チーム × 種類のように、どこに集まっているかを見せるとき

## 使わない場面

- 正確な値を読ませる（[table](table.md)）
- 1 つの軸だけ（[chart-bar](chart-bar.md)）

## ひな形

```html
<section data-pattern="heatmap">
  <h2>問い合わせは、月曜の朝に集まる</h2>
  <table class="heat">
    <thead><tr><th></th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th></tr></thead>
    <tbody>
      <tr><th>9〜12 時</th><td class="hl" style="--v:100">320</td><td style="--v:60">190</td><td style="--v:50">160</td><td style="--v:50">150</td><td style="--v:45">140</td></tr>
      <tr><th>12〜15 時</th><td style="--v:55">170</td><td style="--v:40">130</td><td style="--v:35">110</td><td style="--v:35">110</td><td style="--v:30">100</td></tr>
      <tr><th>15〜18 時</th><td style="--v:40">130</td><td style="--v:30">90</td><td style="--v:30">90</td><td style="--v:25">80</td><td style="--v:35">110</td></tr>
    </tbody>
  </table>
</section>
```

## 書くときの指示

- `table.heat` の `td` に `style="--v:0〜100"`（最大を 100）。濃いほど多い
- 言いたい 1 マスに `hl`
- 値をマスに書く（濃淡だけに頼らない。C8）

## よくある失敗

- 色相を変えて量を表す（C8。濃淡だけで表す）

## 根拠

[共通の規約](../conventions.md) の C8（量は色相ではなく濃淡で表す）。
