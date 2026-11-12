# scr: 状況・問題・解決

状況・問題・解決の 3 段で、話の全体を 1 枚で見せる。

## 使う場面

- 発表の冒頭か最後に、話の筋を 1 枚で言うとき

## 使わない場面

- 困りごとと解き方の対だけ（[problem-solution](problem-solution.md)）

## ひな形

```html
<section data-pattern="scr">
  <h2>朝の会議を待たずに、受付で担当を決める</h2>
  <div class="cols arrow">
    <div class="card" data-step><p class="chip">状況</p><p>担当は朝の会議で決める</p></div>
    <div class="card" data-step><p class="chip">問題</p><p>夕方の件は翌朝まで待つ</p></div>
    <div class="card primary" data-step><p class="chip">解決</p><p>受付で規則が決める</p></div>
  </div>
</section>
```

## 書くときの指示

- `cols arrow` に 3 枚の `card`。`.chip` に「状況」「問題」「解決」
- 各カード 1 文。解決のカードに `primary`

## よくある失敗

- カードに詳しい説明を書く（後のスライドで話す）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C1、C10。
