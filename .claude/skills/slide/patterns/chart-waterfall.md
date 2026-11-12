# chart-waterfall: 増減の内訳

始まりから終わりまでの増減を、段ごとに分けて見せる。

## 使う場面

- 4 時間が 50 分になった内訳のように、何がどれだけ効いたかを見せるとき

## 使わない場面

- 増減がなく、割合だけを見せる（[chart-share](chart-share.md)）

## ひな形

```html
<section data-pattern="chart-waterfall">
  <h2>短くなった 3 時間のうち、2 時間 40 分は振り分けの待ち</h2>
  <ul class="waterfall">
    <li class="total" style="--b:0;--h:100"><span class="value">240 分</span><span class="label">導入前</span></li>
    <li class="down hl" style="--b:33;--h:67"><span class="value">−160</span><span class="label">振り分け</span></li>
    <li class="down" style="--b:21;--h:12"><span class="value">−30</span><span class="label">確認</span></li>
    <li class="total" style="--b:0;--h:21"><span class="value">50 分</span><span class="label">導入後</span></li>
  </ul>
</section>
```

## 書くときの指示

- `ul.waterfall` の `li` が 1 段。`--b` は棒の下端、`--h` は棒の高さ（どちらも最大を 100 とした %）
- 始まりと終わりに `total`、増えた段に `up`、減った段に `down`。言いたい段に `hl`
- 8 段まで

## よくある失敗

- `--b` と `--h` の計算が合わず、段がつながらない（前の段の上端 = 次の段の上端か下端）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C8、C9。
