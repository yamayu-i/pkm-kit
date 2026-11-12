# split-image: 写真と文の左右

写真と文を左右半分ずつに置く。

## 使う場面

- 写真を大きく見せながら、短い説明を添えたいとき（製品、場所、作ったもの）

## 使わない場面

- 写真が主張の根拠で、説明が要らない（[image](image.md)）
- 図や画面の一部を指したい（[screenshot](screenshot.md)）

## ひな形

```html
<section data-pattern="split-image">
  <h2>担当は、受付の一覧に最初から入っている</h2>
  <ul>
    <li data-step>受け付けた直後に、担当の名前が出る</li>
    <li data-step>迷う件には印が付き、リーダーが決める</li>
  </ul>
  <figure class="right"><img src="inbox.png" alt="問い合わせの一覧の画面。各行の右端に担当者の名前が出ている"></figure>
</section>
```

## 書くときの指示

- 写真は `<figure class="right">`（右半分）か `class="left"`（左半分）。最後に置く
- 写真は切り取らず、半分の枠に全部入る（縦長でも横長でもよい）
- 文は見出しと 2〜3 項目まで

## よくある失敗

- 文が多く、半分の幅で読みにくくなる

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C1、C3。
