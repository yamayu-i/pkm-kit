# spectrum: 1 本の軸

2 つの極の間のどこに当たるかを、1 本の軸で見せる。

## 使う場面

- 程度の違い（手作業〜全自動、慎重〜積極）の中で、自分たちや各案の位置を示すとき

## 使わない場面

- 2 つの軸が要る（[matrix-2x2](matrix-2x2.md)）
- 正確な値を比べる（[chart-bar](chart-bar.md)）

## ひな形

```html
<section data-pattern="spectrum">
  <h2>私たちの振り分けは、全自動の手前で止める</h2>
  <div class="spectrum">
    <p class="end">すべて人が決める</p>
    <ol class="track">
      <li style="--v:10">今</li>
      <li class="hl" style="--v:70">提案</li>
      <li style="--v:95">他社の例</li>
    </ol>
    <p class="end">すべて機械が決める</p>
  </div>
</section>
```

## 書くときの指示

- 両端を `.end` に、点を `ol.track` の `li` に書く。位置は `style="--v:0〜100"`（左端が 0）
- 点は 4 つまで。言いたい点に `hl`
- 近すぎる点は文字が重なるので、15 以上離す

## よくある失敗

- 両端の言葉が反対の意味になっていない

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C9（ラベルは点のそばに直接書く）。
