# comparison: 2 つを並べる

A と B の違いを同じ観点で並べる。

## 使う場面

- 2 つの案・製品・方法の違いを見せるとき

## 使わない場面

- 3 つ以上を比べるとき（[decision-table](decision-table.md)）
- 時間の前後のとき（[before-after](before-after.md)）

## ひな形

```html
<section data-pattern="comparison">
  <h2>自動振り分けは、人の判断を待たずに担当を決める</h2>
  <div class="cols">
    <div class="card">
      <h3>今: 朝の会議で振り分ける</h3>
      <ul>
        <li>担当が決まるのは 1 日 1 回</li>
        <li>リーダーが全件を読む</li>
      </ul>
    </div>
    <div class="card primary">
      <h3>提案: 受付で自動に振り分ける</h3>
      <ul>
        <li>担当は受付の直後に決まる</li>
        <li>リーダーが読むのは、迷う件だけ</li>
      </ul>
    </div>
  </div>
</section>
```

## 書くときの指示

- 2 つのカードの項目は、同じ観点を同じ順に書く
- 推したい方に `primary` を付ける（色の違いは、それだけにする）

## よくある失敗

- 左右で観点がずれていて、見比べられない

## 根拠

[共通の規約](../conventions.md) の C4、C6、C14。
