# timeline: 年表・予定

いつ何が起きるか（経緯、ロードマップ）を見せる。

## 使う場面

- これまでの経緯、これからの予定

## 使わない場面

- 日付が要らない順序（[process](process.md)）

## ひな形

```html
<section data-pattern="timeline">
  <h2>12 月の第 1 週に、全チームへの展開を終える</h2>
  <ol class="timeline">
    <li><time>9〜10 月</time><h3>試験導入</h3><p>契約・請求の 2 チーム</p></li>
    <li class="now"><time>11 月</time><h3>規則をそろえる</h3><p>残り 4 チーム分</p></li>
    <li><time>12/1</time><h3>全チームに展開</h3><p>朝の会議は 10 分に</p></li>
    <li><time>1 月</time><h3>規則の見直し</h3><p>以後は月 1 回</p></li>
  </ol>
</section>
```

## 書くときの指示

- 左から右へ時間が進む。4 つまで
- 今の時点に `class="now"`
- `<time>` の書き方（月か日か）をそろえる

## よくある失敗

- 期間の長さが違うのに、同じ幅で並んでいることを言わない

## 根拠

[共通の規約](../conventions.md) の C4、C6。
