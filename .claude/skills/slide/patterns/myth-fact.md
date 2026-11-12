# myth-fact: 思い込みと実際

よくある思い込みと、実際を対にして正す。

## 使う場面

- 聞き手が誤って信じていそうなことを、根拠とともに正すとき

## 使わない場面

- 2 つの案を比べる（[comparison](comparison.md)）
- 前と後の変化（[before-after](before-after.md)）

## ひな形

```html
<section data-pattern="myth-fact">
  <h2>自動振り分けは、担当の判断を減らさない</h2>
  <ul class="pairs">
    <li data-step><p class="myth">担当が考えずに済むようになる</p><p class="fact">決めるのは担当の割り当てだけ。返事は担当が考える</p></li>
    <li data-step><p class="myth">迷う件も機械が決める</p><p class="fact">迷う件（全体の 1 割）は、今までどおり人が決める</p></li>
  </ul>
</section>
```

## 書くときの指示

- `ul.pairs` の 1 項目に `.myth`（思い込み）と `.fact`（実際）を 1 つずつ。3 組まで
- 思い込みは聞き手の言葉で、実際は根拠のある文で書く

## よくある失敗

- 思い込みを強く見せすぎて、そちらが記憶に残る（実際の方が目立つ形になっている）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C6。
