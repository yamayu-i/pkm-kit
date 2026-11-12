# chart-column: 縦棒グラフ

期間ごとの量の移り変わりを縦棒で見せ、1 本を目立たせる。

## 使う場面

- 月ごと・週ごとの量の変化を、数本〜12 本の棒で見せるとき

## 使わない場面

- 項目どうしを比べる（[chart-bar](chart-bar.md)。名前が長くても入る）
- 細かい変化と転換点（[chart-line](chart-line.md)）

## ひな形

```html
<section data-pattern="chart-column">
  <h2>問い合わせは、10 月に 1.5 倍に増えた</h2>
  <ul class="columns">
    <li style="--v:60"><span class="value">820</span><span class="label">7 月</span></li>
    <li style="--v:64"><span class="value">870</span><span class="label">8 月</span></li>
    <li style="--v:66"><span class="value">900</span><span class="label">9 月</span></li>
    <li class="hl" style="--v:100"><span class="value">1,360</span><span class="label">10 月</span></li>
  </ul>
  <p class="source">出典: 問い合わせ管理の記録（件数）</p>
</section>
```

## 書くときの指示

- `ul.columns` の `li` が棒。高さは `style="--v:0〜100"`（最大を 100）。値は `.value`、期間は `.label`
- 言いたい 1 本に `hl`
- 12 本まで

## よくある失敗

- 棒ごとに色を変える（C8）
- 軸が 0 から始まっていないような高さを付ける

## 根拠

[共通の規約](../conventions.md) の C8（量は濃淡で）、C9（値は棒の端に直接書く）。
