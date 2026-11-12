# kpi: 指標

2〜4 個の指標の今の値と変化を見せる。

## 使う場面

- 定例の報告、結果のまとめ

## 使わない場面

- 指標が 1 つ（[big-number](big-number.md)）
- 指標の間の関係を見せたいとき（グラフにする）

## ひな形

```html
<section data-pattern="kpi">
  <h2>応答は速くなり、満足度も上がった</h2>
  <div class="cols">
    <div class="card kpi primary"><p class="label">初回応答</p><p class="big">50<span class="unit">分</span></p><p class="delta down">4 時間から</p></div>
    <div class="card kpi"><p class="label">当日中の解決</p><p class="big">68<span class="unit">%</span></p><p class="delta up">41% から</p></div>
    <div class="card kpi"><p class="label">満足度</p><p class="big">4.4<span class="unit">/ 5</span></p><p class="delta up">3.9 から</p></div>
  </div>
  <p class="source">出典: 試験導入の 2 チーム（2026 年 9〜10 月）</p>
</section>
```

## 書くときの指示

- カードは 4 つまで。指標の名前（`.label`）・値（`.big`）・変化（`.delta up` / `down`）をそろえる
- 見出しで、指標をまとめて何が言えるかを言う
- 変化は、良い悪いではなく上がった・下がったを印で示す（良し悪しは見出しで言う）

## よくある失敗

- 指標を並べるだけで、何が言えるのかを書かない

## 根拠

[共通の規約](../conventions.md) の C1、C4、C6。
