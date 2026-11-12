# decision-table: 選択肢の表

3 つ以上の案を同じ評価軸で比べ、選んだ案を示す。

## 使う場面

- 案を選んだ理由を見せるとき

## 使わない場面

- 案が 2 つのとき（[comparison](comparison.md)）
- 評価軸が 5 つを超えるとき（軸を絞るか、付録に置く）

## ひな形

```html
<section data-pattern="decision-table">
  <h2>自動振り分けは、費用をかけずに待ちをなくせる唯一の案</h2>
  <table>
    <thead>
      <tr><th></th><th>会議を 1 日 2 回に</th><th class="pick">自動で振り分ける</th><th>振り分けの専任を置く</th></tr>
    </thead>
    <tbody>
      <tr><th>待ち時間</th><td class="mid">半分になる</td><td class="pick good">ほぼなくなる</td><td class="good">ほぼなくなる</td></tr>
      <tr><th>費用</th><td class="good">かからない</td><td class="pick good">かからない</td><td class="bad">1 人分の人件費</td></tr>
      <tr><th>始めるまで</th><td class="good">すぐ</td><td class="pick mid">規則づくりに 2 週間</td><td class="bad">採用に 3 か月</td></tr>
    </tbody>
  </table>
</section>
```

## 書くときの指示

- 行が評価軸、列が案。選んだ案の列に `pick` を付ける
- セルは `good` / `mid` / `bad` の印に、短い語を添える（印だけ・色だけにしない）
- 評価軸は、判断に効くものを 3〜4 つ

## よくある失敗

- 選んだ案だけ評価が甘い
- セルに文を書き、読むのに時間がかかる

## 根拠

[共通の規約](../conventions.md) の C4、C6、C8。
