# before-after: 前と後

変える前と後で、何が変わるかを見せる。

## 使う場面

- 変更・改善の効果を見せるとき

## 使わない場面

- 変わる点が 4 つを超えるとき（[table](table.md)）

## ひな形

```html
<section data-pattern="before-after">
  <h2>受付の直後に担当が決まり、朝の待ちがなくなる</h2>
  <div class="cols arrow">
    <div class="card gray">
      <p class="chip">Before</p>
      <h3>朝の会議まで待つ</h3>
      <p>夕方の問い合わせは、翌朝まで誰も見ない</p>
    </div>
    <div class="card primary">
      <p class="chip">After</p>
      <h3>受付で担当が決まる</h3>
      <p>夕方の問い合わせも、その日のうちに返せる</p>
    </div>
  </div>
</section>
```

## 書くときの指示

- 左が前、右が後（`.cols.arrow` が矢印を出す）
- 前と後で、同じ場面を書く

## よくある失敗

- 後だけ詳しく書き、前と見比べられない

## 根拠

[共通の規約](../conventions.md) の C6、C14。
