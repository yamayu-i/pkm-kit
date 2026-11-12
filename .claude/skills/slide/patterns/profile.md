# profile: 人の紹介

話し手やチームの人を、写真・名前・役割で紹介する。

## 使う場面

- 登壇者の紹介、プロジェクトの体制、問い合わせ先の人

## 使わない場面

- 組織の全体の形を見せたいとき（[tree](tree.md)）
- 5 人以上（役割でまとめるか、[grid](grid.md)）

## ひな形

```html
<section data-pattern="profile">
  <h2>試験導入は、3 人で進めた</h2>
  <div class="cols">
    <div class="card"><img class="avatar" src="person-1.png" alt="佐藤の写真"><h3>佐藤</h3><p class="label">リーダー</p><p>規則づくり</p></div>
    <div class="card"><img class="avatar" src="person-2.png" alt="鈴木の写真"><h3>鈴木</h3><p class="label">請求チーム</p><p>試験の運用</p></div>
    <div class="card"><img class="avatar" src="person-3.png" alt="高橋の写真"><h3>高橋</h3><p class="label">情報システム</p><p>連携の設定</p></div>
  </div>
</section>
```

## 書くときの指示

- 1 人 1 枚のカード。`img.avatar`（写真）、`<h3>`（名前）、`.label`（役割）、1 行の説明
- 写真がなければ `img.avatar` を省いてよい（全員そろえる）
- 4 人まで

## よくある失敗

- 経歴を長く書く（話すことは発表者ノートへ。C3）

## 根拠

パターンそのものの実験の根拠はない。[共通の規約](../conventions.md) の配置の規則に従う形にした。C4、C14。
