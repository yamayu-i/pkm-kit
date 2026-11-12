# options: 案の並び

2〜3 つの案を同じ形で並べ、勧める 1 つを示す。

## 使う場面

- いくつかの案から 1 つを選んでほしいとき（費用・期間・範囲の違う案）

## 使わない場面

- 評価軸が多く、表で比べたいとき（[decision-table](decision-table.md)）
- 案が 1 つ（[pros-cons](pros-cons.md)）

## ひな形

```html
<section data-pattern="options">
  <h2>まず請求チームだけで始める案 B を勧める</h2>
  <div class="cols">
    <div class="card"><p class="chip">案 A</p><h3>全チーム一斉</h3><ul><li>2 週間で全部</li><li>止まると全体に響く</li></ul></div>
    <div class="card pick"><p class="chip">案 B · おすすめ</p><h3>請求から順に</h3><ul><li>1 か月で 2 チーム</li><li>規則を直しながら広げる</li></ul></div>
    <div class="card"><p class="chip">案 C</p><h3>見送る</h3><ul><li>費用はかからない</li><li>待ちは減らない</li></ul></div>
  </div>
</section>
```

## 書くときの指示

- 案ごとに `card`。勧める案だけに `pick`（枠と面の色が変わる）
- どの案も同じ項目を同じ順で書く（期間 → 影響、など）
- 3 つまで

## よくある失敗

- 勧める案だけ項目が多い・良いことだけ書く
- `pick` を 2 つに付ける

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C6、C14。
