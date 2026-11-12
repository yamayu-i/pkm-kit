# matrix-2x2: 2 軸の 4 象限

2 つの軸で分類し、どこに当たるかを見せる。

## 使う場面

- 優先順位づけ、位置づけの整理

## 使わない場面

- 軸が聞き手に馴染みのないもののとき（先に軸を説明する）

## ひな形

```html
<section data-pattern="matrix-2x2">
  <h2>まず、件数が多く規則が単純な「請求」から広げる</h2>
  <div class="matrix">
    <p class="axis-y">件数（少 → 多）</p>
    <p class="axis-x">振り分けの規則（単純 → 複雑）</p>
    <div class="card primary"><h3>請求・契約</h3><p>最初に広げる</p></div>
    <div class="card"><h3>技術</h3><p>規則を作ってから</p></div>
    <div class="card"><h3>解約</h3><p>2 番目に広げる</p></div>
    <div class="card"><h3>法務</h3><p>人のまま</p></div>
  </div>
</section>
```

## 書くときの指示

- カードは、左上・右上・左下・右下の順に 4 つ
- 軸の名前に、向き（少 → 多）を書く
- 注目させる象限 1 つだけに `primary`

## よくある失敗

- 4 象限に同じ重さで文を詰める

## 根拠

[共通の規約](../conventions.md) の C4、C6。
