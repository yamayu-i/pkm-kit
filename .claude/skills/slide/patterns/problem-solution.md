# problem-solution: 課題と解決

困っていることと、その解き方を対にする。

## 使う場面

- 提案の入口、機能の紹介

## 使わない場面

- 課題が 2 つ以上あるとき（課題ごとに 1 枚）

## ひな形

```html
<section data-pattern="problem-solution">
  <h2>待ちの原因は人の振り分けなので、振り分けを自動にする</h2>
  <div class="cols arrow">
    <div class="card red">
      <p class="chip">Problem</p>
      <h3>担当が決まるまで 2 時間 50 分</h3>
      <p>朝の会議まで、誰も手を付けられない</p>
    </div>
    <div class="card green">
      <p class="chip">Solution</p>
      <h3>受付で自動に振り分ける</h3>
      <p>種類とプランと空きから、すぐに決める</p>
    </div>
  </div>
</section>
```

## 書くときの指示

- 見出しで、課題と解決を 1 文でつなぐ
- 課題には、どの程度困っているかを数字で書く
- 解決は、その課題の原因に効くものを書く

## よくある失敗

- 解決が、書いた課題と対応していない

## 根拠

[共通の規約](../conventions.md) の C1、C6、C8。
