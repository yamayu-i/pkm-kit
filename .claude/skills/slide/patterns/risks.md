# risks: リスクと対策

起こりうることと備えを対にし、大きさを示す。

## 使う場面

- 計画の承認を求めるときに、懸念に先回りして答える

## 使わない場面

- 良い点と悪い点の比較（[pros-cons](pros-cons.md)）

## ひな形

```html
<section data-pattern="risks">
  <h2>振り分けの誤りは、迷う件を人に回すことで抑える</h2>
  <ul class="risks">
    <li><p class="level high">高</p><p class="risk">規則が誤り、違う担当に届く</p><p class="fix">迷う件は人に回す</p></li>
    <li><p class="level mid">中</p><p class="risk">担当に件数が偏る</p><p class="fix">空きを見て決める</p></li>
    <li><p class="level low">低</p><p class="risk">通知が届かない</p><p class="fix">一覧にも出す</p></li>
  </ul>
</section>
```

## 書くときの指示

- `ul.risks` の `li` に `.level`（大きさ。`high` / `mid` / `low`）、`.risk`（起こりうること）、`.fix`（対策）
- 大きい順に並べる。4 つまで

## よくある失敗

- 対策のないリスクを並べる（なら、そう書く）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C8（大きさは文字でも書く）。
