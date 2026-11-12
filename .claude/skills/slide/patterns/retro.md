# retro: 振り返り

続けること・困ったこと・次に試すことを並べる。

## 使う場面

- 試験や期間の終わりに、学んだことをまとめるとき

## 使わない場面

- 結果の数字を見せる（[kpi](kpi.md)）

## ひな形

```html
<section data-pattern="retro">
  <h2>試験導入で、規則は週 1 回見直すのがよいと分かった</h2>
  <div class="cols retro">
    <div class="card"><p class="chip green">続けること</p><ul><li>迷う件を人に回す</li></ul></div>
    <div class="card"><p class="chip red">困ったこと</p><ul><li>新しい分類に追いつかない</li></ul></div>
    <div class="card primary"><p class="chip">次に試すこと</p><ul><li>規則を週 1 回見直す</li></ul></div>
  </div>
</section>
```

## 書くときの指示

- `cols retro` に 3 枚の `card`。分類の名前は `.chip`（色はチップだけに付ける）
- 次に試すことのカードに `primary`
- 各カード 1〜2 項目

## よくある失敗

- 項目を詰め込み、どれが大事か分からなくなる

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C6。
