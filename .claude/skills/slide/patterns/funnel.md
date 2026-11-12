# funnel: 絞り込み

段階ごとに減っていく量を見せる。

## 使う場面

- 申し込みの流れ、選考、絞り込みで、どこで減るかを見せるとき

## 使わない場面

- 減らないもの、量のない段階

## ひな形

```html
<section data-pattern="funnel">
  <h2>人が決める必要があるのは、全体の 1 割だけ</h2>
  <ol class="funnel">
    <li style="--v:100"><h3>受け付けた問い合わせ</h3><p class="value">1,200 件</p></li>
    <li style="--v:42"><h3>規則が 2 つ以上当たった</h3><p class="value">504 件</p></li>
    <li style="--v:10" class="primary"><h3>人が担当を決めた</h3><p class="value">118 件</p></li>
  </ol>
  <p class="source">出典: 試験導入の記録（2026 年 9〜10 月）</p>
</section>
```

## 書くときの指示

- `--v` は最初の段を 100 とした割合
- 各段に実際の数を書く（幅だけで量を読ませない）
- 見てほしい段 1 つに `primary`

## よくある失敗

- 幅と数が合っていない

## 根拠

[共通の規約](../conventions.md) の C4、C6、C9。
