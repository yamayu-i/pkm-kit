# diagram: 図

仕組み・構成・関係を図で見せる。

## 使う場面

- 構成、関係、データの流れ

## 使わない場面

- 単純な順序（[process](process.md)）や層（[layers](layers.md)）で足りるとき

## ひな形

```html
<section data-pattern="diagram">
  <h2>振り分けは、受付と各チームの間に入る</h2>
  <figure>
    <svg viewBox="0 0 1600 560" role="img" aria-label="受付から振り分けを通って、請求・契約・技術の 3 チームに届く">
      <rect class="box" x="60" y="200" width="340" height="160" rx="24"/>
      <text x="230" y="292" text-anchor="middle">受付</text>
      <rect class="box primary" x="620" y="200" width="360" height="160" rx="24"/>
      <text class="hl" x="800" y="292" text-anchor="middle">振り分け</text>
      <rect class="box" x="1200" y="20" width="340" height="140" rx="24"/>
      <text x="1370" y="102" text-anchor="middle">請求チーム</text>
      <rect class="box" x="1200" y="210" width="340" height="140" rx="24"/>
      <text x="1370" y="292" text-anchor="middle">契約チーム</text>
      <rect class="box" x="1200" y="400" width="340" height="140" rx="24"/>
      <text x="1370" y="482" text-anchor="middle">技術チーム</text>
      <path class="edge hl" d="M400 280 H600"/>
      <path class="arrowhead" d="M620 280 l-28 -14 v28 z"/>
      <path class="edge" d="M980 250 C1080 250 1090 90 1180 90"/>
      <path class="arrowhead" d="M1200 90 l-28 -14 v28 z"/>
      <path class="edge" d="M980 280 H1180"/>
      <path class="arrowhead" d="M1200 280 l-28 -14 v28 z"/>
      <path class="edge" d="M980 310 C1080 310 1090 470 1180 470"/>
      <path class="arrowhead" d="M1200 470 l-28 -14 v28 z"/>
    </svg>
  </figure>
</section>
```

## 書くときの指示

- SVG を直接書く（`viewBox` の幅は 1600）。D2 で描いた SVG をデッキのフォルダに置いて `<img>` で参照してもよい
- 使うクラス: `box`（箱。色のクラスを足せる）、`edge`（線）、`arrowhead`（矢じり）、`hl`（強調）、`small`（小さい文字）。色の値は書かない
- 箱は 6 つまで。名前は箱の中に書く
- 話題にしている箱と線だけを `primary` / `hl` にする
- 書いたら、画像にして重なりとはみ出しを確かめる

## よくある失敗

- 既存の大きい構成図をそのまま貼る
- 矢印の意味（データの流れか、依存か）が混ざっている

## 根拠

[共通の規約](../conventions.md) の C4、C6、C9。
