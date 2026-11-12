# chart-share: 内訳

全体に占める割合を見せる。

## 使う場面

- 全体を 2〜4 つに分けた内訳

## 使わない場面

- 区分が 5 つ以上（小さいものを「その他」にまとめるか、[chart-bar](chart-bar.md)）
- 合計が 100% にならないもの

## ひな形

```html
<section data-pattern="chart-share">
  <h2>初回応答までの時間の 7 割は、担当が決まるまでの待ち</h2>
  <ul class="share">
    <li class="primary" style="--v:71"><span class="value">71%</span><span class="label">担当が決まるまでの待ち</span></li>
    <li class="gray" style="--v:29"><span class="value">29%</span><span class="label">担当の作業</span></li>
  </ul>
  <p class="source">出典: 問い合わせ管理の記録（1,200 件の中央値）</p>
</section>
```

## 書くときの指示

- `--v` は %。合計を 100 にする
- 値と名前を、帯の中に直接書く
- 見出しで言っている区分に `primary`、ほかは `gray`

## よくある失敗

- 区分ごとに違う色を付ける
- 幅が狭すぎて、名前が入らない区分を作る

## 根拠

[共通の規約](../conventions.md) の C6、C8、C9。
