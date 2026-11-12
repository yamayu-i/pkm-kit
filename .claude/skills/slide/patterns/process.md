# process: 手順

順に進む 2〜4 の手順を見せる。

## 使う場面

- 作業の流れ、処理の順

## 使わない場面

- 回り続けるもの（[cycle](cycle.md)）
- 日付が大事なもの（[timeline](timeline.md)）
- 5 つ以上の手順（段階にまとめるか、2 枚に分ける）

## ひな形

```html
<section data-pattern="process">
  <h2>問い合わせは、3 つの手順で担当に届く</h2>
  <ol class="steps">
    <li data-step><h3>受け付ける</h3><p>フォームの分類を読む</p></li>
    <li data-step><h3>振り分ける</h3><p>規則で担当を決める</p></li>
    <li data-step><h3>知らせる</h3><p>担当に通知する</p></li>
  </ol>
</section>
```

## 書くときの指示

- `<h3>` は動詞で終える
- 番号は自動で付く。4 つまで
- 順に説明するなら `data-step` を付ける

## よくある失敗

- 手順の粒がそろっていない（1 つだけ細かい）

## 根拠

[共通の規約](../conventions.md) の C4、C10。
