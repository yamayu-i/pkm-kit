# table: 表

正確な値を、行と列で引けるようにする。

## 使う場面

- 値そのものを読ませたいとき、行と列の両方で見比べるとき

## 使わない場面

- 傾向を見せたいとき（グラフにする）
- 5 行・5 列を超えるとき（絞るか、[appendix](appendix.md) に置く）

## ひな形

```html
<section data-pattern="table">
  <h2>試験導入の 2 チームとも、初回応答が 1 時間を切った</h2>
  <table>
    <thead><tr><th>チーム</th><th class="num">件数</th><th class="num">導入前</th><th class="num">導入後</th></tr></thead>
    <tbody>
      <tr><th>契約</th><td class="num">412</td><td class="num">3 時間 50 分</td><td class="num hl">45 分</td></tr>
      <tr><th>請求</th><td class="num">388</td><td class="num">4 時間 10 分</td><td class="num hl">55 分</td></tr>
    </tbody>
  </table>
  <p class="source">出典: 問い合わせ管理の記録（2026 年 9〜10 月、中央値）</p>
</section>
```

## 書くときの指示

- 数は `class="num"` で右にそろえ、単位と桁をそろえる
- 見出しで言っているセルか行に `hl`
- 行の見出しは `<th>`

## よくある失敗

- 表計算の表をそのまま貼る
- 見てほしいセルを示さない

## 根拠

[共通の規約](../conventions.md) の C4、C6。
