# pros-cons: 良い点と悪い点

1 つの案の良い点と悪い点を並べる。

## 使う場面

- 案の弱みも見せたうえで判断してほしいとき

## 使わない場面

- 案が複数あるとき（[decision-table](decision-table.md)）

## ひな形

```html
<section data-pattern="pros-cons">
  <h2>規則の手入れは要るが、待ちをなくす効果が上回る</h2>
  <div class="cols">
    <div class="card green">
      <h3>良い点</h3>
      <ul>
        <li>初回応答が 4 時間から 50 分に</li>
        <li>朝の会議が 30 分から 10 分に</li>
      </ul>
    </div>
    <div class="card red">
      <h3>悪い点</h3>
      <ul>
        <li>振り分けの規則を月 1 回見直す</li>
        <li>迷う件（全体の 1 割）は人が決める</li>
      </ul>
    </div>
  </div>
</section>
```

## 書くときの指示

- 見出しで、差し引きの結論を言う
- 色だけで良い・悪いを伝えない（`<h3>` に書く）
- 悪い点には、どの程度かを数字で添える

## よくある失敗

- 悪い点を小さく見せるために、項目の数を偏らせる

## 根拠

[共通の規約](../conventions.md) の C1、C4、C8。
