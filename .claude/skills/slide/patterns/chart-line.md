# chart-line: 折れ線グラフ

時間に沿った変化と、その転換点を見せる。

## 使う場面

- 推移、導入の前後の変化

## 使わない場面

- 時点が 2 つしかないとき（[big-number](big-number.md)、[before-after](before-after.md)）
- 項目の比較（[chart-bar](chart-bar.md)）

## ひな形

```html
<section data-pattern="chart-line">
  <h2>導入した週から、初回応答は 1 時間を下回っている</h2>
  <figure>
    <svg viewBox="0 0 1600 620" role="img" aria-label="週ごとの初回応答の時間。導入前は約 4 時間、導入後は 1 時間未満">
      <line class="grid" x1="120" y1="100" x2="1500" y2="100"/>
      <line class="grid" x1="120" y1="320" x2="1500" y2="320"/>
      <line class="axis" x1="120" y1="540" x2="1500" y2="540"/>
      <text class="small" x="100" y="112" text-anchor="end">4h</text>
      <text class="small" x="100" y="332" text-anchor="end">2h</text>
      <text class="small" x="100" y="552" text-anchor="end">0</text>
      <text class="small" x="150" y="596" text-anchor="middle">9/1</text>
      <text class="small" x="810" y="596" text-anchor="middle">10/1</text>
      <text class="small" x="1470" y="596" text-anchor="middle">10/27</text>
      <polyline class="line" points="150,110 315,95 480,120 645,105"/>
      <polyline class="line hl" points="645,105 810,440 975,455 1140,448 1305,460 1470,452"/>
      <circle class="dot hl" cx="810" cy="440" r="12"/>
      <text class="hl" x="840" y="400">導入した週に 50 分へ</text>
      <text class="small" x="150" y="70">導入前: 約 4 時間</text>
    </svg>
  </figure>
  <p class="source">出典: 問い合わせ管理の記録（契約・請求の 2 チーム、週ごとの中央値）</p>
</section>
```

## 書くときの指示

- SVG を直接書く。`viewBox` の幅は 1600 にする（文字が規約の大きさになる）
- 使うクラス: `axis`（軸）、`grid`（目盛りの線）、`line`（線）、`dot`（点）、`small`（軸の文字）、`hl`（強調）。色の値は書かない
- 系列の名前と転換点の説明は、線のそばに直接書く
- 目盛りは 2〜3 本。縦軸は 0 から始める（始めないなら、そう書く）
- `aria-label` に、グラフから読み取れることを書く

## よくある失敗

- 線が 4 本以上あり、どれを見るのかが分からない
- 凡例を別に置く

## 根拠

[共通の規約](../conventions.md) の C2、C6、C9。
