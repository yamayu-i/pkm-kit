# screenshot-compare: 画面の前と後

変える前と後の画面を並べる。

## 使う場面

- 画面の変更で、何が変わるかを見せるとき

## 使わない場面

- 画面の 1 か所を指して説明する（[screenshot](screenshot.md)）
- 画面ではなく仕組みの変化（[before-after](before-after.md)）

## ひな形

```html
<section data-pattern="screenshot-compare">
  <h2>担当の欄が、空から自動で埋まるようになる</h2>
  <div class="cols arrow">
    <figure><img src="inbox-before.png" alt="変更前の一覧。担当の欄が空になっている"><figcaption>今</figcaption></figure>
    <figure><img src="inbox-after.png" alt="変更後の一覧。担当の欄に名前が入っている"><figcaption>変えた後</figcaption></figure>
  </div>
</section>
```

## 書くときの指示

- `cols arrow` の中に `<figure>` を 2 つ（前 → 後）
- 2 枚は同じ範囲・同じ大きさで撮る

## よくある失敗

- 範囲の違う 2 枚を並べる（違いがどこか分からない）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C14。
