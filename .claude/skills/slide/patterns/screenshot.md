# screenshot: 画面

画面のどこを見るかを指して説明する。

## 使う場面

- 画面の使い方、変更点の説明

## 使わない場面

- 画面全体の雰囲気だけを見せたいとき（[image](image.md)）

## ひな形

```html
<section data-pattern="screenshot">
  <h2>担当は、受付の一覧に最初から入っている</h2>
  <figure>
    <img src="inbox.png" alt="問い合わせの一覧の画面。各行の右端に担当者の名前が出ている">
    <aside class="callout" style="--x:78;--y:38" data-step>担当が自動で入る</aside>
    <aside class="callout" style="--x:30;--y:72" data-step>迷う件には印が付く</aside>
  </figure>
</section>
```

## 書くときの指示

- 見てほしい場所に `.callout` を置く。位置は `--x` / `--y`（図の左上から %）
- `.callout` は 3 つまで。短い語句にする
- 画面は、見てほしい部分が読める大きさに切り出す

## よくある失敗

- 画面全体を縮めて貼り、文字が読めない
- どこを見るのかを話だけで補う

## 根拠

[共通の規約](../conventions.md) の C4、C6、C9、C10。
