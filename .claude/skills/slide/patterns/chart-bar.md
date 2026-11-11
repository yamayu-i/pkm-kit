# chart-bar: 棒グラフ

項目どうしの量を比べ、1 つを目立たせる。

## 使う場面

- 項目ごとの量の比較、順位

## 使わない場面

- 時間に沿った変化（[chart-line](chart-line.md)）
- 全体に占める割合（[chart-share](chart-share.md)）

## ひな形

```html
<section data-pattern="chart-bar">
  <h2>請求の問い合わせが、待ち時間の最も長い種類</h2>
  <ul class="bars">
    <li class="hl" style="--v:100"><span class="label">請求</span><span class="value">4 時間 10 分</span></li>
    <li style="--v:92"><span class="label">契約</span><span class="value">3 時間 50 分</span></li>
    <li style="--v:70"><span class="label">技術</span><span class="value">2 時間 55 分</span></li>
    <li style="--v:43"><span class="label">解約</span><span class="value">1 時間 50 分</span></li>
  </ul>
  <p class="source">出典: 問い合わせ管理の記録（2026 年 9〜10 月、中央値）</p>
</section>
```

## 書くときの指示

- `--v` は最大の棒を 100 とした割合（0 から始める）
- 値は棒の端に直接書く（`.value`）。軸と凡例は置かない
- 見出しで言っている棒 1 本だけに `hl`。ほかは無彩色のまま
- 大きい順に並べる（順番に意味がある項目を除く）

## よくある失敗

- 棒ごとに色を変える
- 見出しが「種類別の待ち時間」のような、グラフの題になっている

## 根拠

[共通の規約](../conventions.md) の C2、C6、C8、C9。
