# roadmap: ロードマップ

期間 × 流れ（チーム・テーマ）の上に、いつ何をするかを置く。

## 使う場面

- 複数の流れが並行して進む予定を見せるとき

## 使わない場面

- 流れが 1 本（[timeline](timeline.md)）
- 日付の細かい管理（表か、タスク管理のツール）

## ひな形

```html
<section data-pattern="roadmap">
  <h2>請求で 1 か月試してから、残りのチームに広げる</h2>
  <div class="roadmap" style="--cols:4">
    <ol class="periods"><li>11 月</li><li>12 月</li><li>1 月</li><li>2 月</li></ol>
    <div class="lane"><p class="track">請求</p><p class="bar primary" style="--s:1;--e:1">試験</p><p class="bar" style="--s:2;--e:4">本番</p></div>
    <div class="lane"><p class="track">契約</p><p class="bar" style="--s:2;--e:2">準備</p><p class="bar" style="--s:3;--e:4">本番</p></div>
    <div class="lane"><p class="track">技術</p><p class="bar" style="--s:4;--e:4">準備</p></div>
  </div>
</section>
```

## 書くときの指示

- `.roadmap` に期間の数を `style="--cols:4"` で書き、`ol.periods` に期間の名前を並べる（8 つまで）
- 流れごとに `.lane`。先頭に `.track`（流れの名前）、続けて `.bar`。`--s` は始まりの期間の番号、`--e` は終わりの番号（1 から）
- 流れは 4 本まで。今の段に `primary`

## よくある失敗

- 期間を細かく分けすぎて、棒の文字が入らない

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C9。
