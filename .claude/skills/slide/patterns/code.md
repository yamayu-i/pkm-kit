# code: コード

短いコードの、見てほしい行を示す。

## 使う場面

- 設定や書き方を示すとき

## 使わない場面

- 15 行を超えるコード（要る部分だけにする）
- 動きを見せたいとき（実演する）

## ひな形

```html
<section data-pattern="code">
  <h2>規則は、種類とプランから担当のチームを決める 1 行で書ける</h2>
  <pre><code>rules:
  - when: { type: billing }
<mark>    assign: billing-team</mark>
  - when: { type: contract, plan: enterprise }
    assign: key-accounts</code></pre>
  <ul>
    <li>上から順に当てはめる</li>
    <li>当たらなければ人が決める</li>
  </ul>
</section>
```

## 書くときの指示

- 見てほしい行を `<mark>` で囲む
- `<` と `&` は `&lt;` と `&amp;` で書く
- 横の説明は 2〜3 項目。なくてもよい

## よくある失敗

- コードを全部貼る
- 文字を小さくして詰める

## 根拠

[共通の規約](../conventions.md) の C3、C6。
