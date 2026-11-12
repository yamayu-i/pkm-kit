# two-numbers: 2 つの数字

2 つの数字を並べて差を見せる（前と後、目標と実績）。

## 使う場面

- 変化の大きさを数字 2 つで言えるとき
- 目標と今の値の差を見せたいとき

## 使わない場面

- 数字が 1 つだけ（[big-number](big-number.md)）
- 3 つ以上（[kpi](kpi.md)）
- 途中の移り変わりが大事（[chart-line](chart-line.md)）

## ひな形

```html
<section data-pattern="two-numbers">
  <h2>試験導入で、初回応答は 5 分の 1 になった</h2>
  <div class="cols arrow">
    <div class="card kpi"><p class="label">導入前</p><p class="big">4<span class="unit">時間</span></p></div>
    <div class="card kpi primary"><p class="label">導入後</p><p class="big">50<span class="unit">分</span></p></div>
  </div>
  <p class="source">出典: 問い合わせ管理の記録（2026 年 9〜10 月の中央値）</p>
</section>
```

## 書くときの指示

- `cols arrow` の中に `card kpi` を 2 つ。言いたい方（後・実績）に `primary`
- 単位は `<span class="unit">` で小さくする
- 数字の出どころを `.source` に書く

## よくある失敗

- 単位や条件がそろっていない 2 つを並べる

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C6（強調は 1 か所）、C9。
