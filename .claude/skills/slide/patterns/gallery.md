# gallery: 写真の並び

2〜6 枚の写真を並べて見せる。

## 使う場面

- いくつかの現場・作例・変化を、写真で見比べさせるとき

## 使わない場面

- 1 枚で足りる（[image](image.md)）
- 前と後の画面（[screenshot-compare](screenshot-compare.md)）

## ひな形

```html
<section data-pattern="gallery">
  <h2>3 つの拠点で、同じ一覧の画面を使っている</h2>
  <div class="gallery">
    <figure><img src="site-tokyo.jpg" alt="東京の拠点の執務室"><figcaption>東京</figcaption></figure>
    <figure><img src="site-osaka.jpg" alt="大阪の拠点の執務室"><figcaption>大阪</figcaption></figure>
    <figure><img src="site-fukuoka.jpg" alt="福岡の拠点の執務室"><figcaption>福岡</figcaption></figure>
  </div>
</section>
```

## 書くときの指示

- `.gallery` の中に `<figure>` を 2〜6 つ。写真は切り取らず、枠に全部入る
- `<figcaption>` は短い名前だけ

## よくある失敗

- 何を見比べるのかを見出しで言わない

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C1、C14。
