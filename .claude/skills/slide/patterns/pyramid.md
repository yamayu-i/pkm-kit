# pyramid: 積み上げ

土台から頂点へ積み上がる段（優先度、成熟度）を見せる。

## 使う場面

- 下の段ができてから上に進む、という関係を見せるとき

## 使わない場面

- 段に上下の関係がない（[layers](layers.md) か [cards](cards.md)）
- 量が段ごとに減る（[funnel](funnel.md)）

## ひな形

```html
<section data-pattern="pyramid">
  <h2>自動化は、記録をそろえることから始まる</h2>
  <ol class="pyramid">
    <li data-step="3"><h3>自動で振り分ける</h3></li>
    <li data-step="2"><h3>規則を決める</h3></li>
    <li data-step="1"><h3>分類を記録する</h3></li>
  </ol>
</section>
```

## 書くときの指示

- `ol.pyramid` に、頂点から順に書く（上の段ほど狭くなる）。4 段まで
- 下から順に話すなら、`data-step` の数を下の段から 1, 2, 3 にする

## よくある失敗

- 段の幅で量を伝えようとする（幅は位置を示すだけ）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C10。
