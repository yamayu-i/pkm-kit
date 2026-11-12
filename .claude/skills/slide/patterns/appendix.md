# appendix: 付録

聞かれたら見せる細かい資料を置く。話の本筋では出さない。

## 使う場面

- 質疑で出すかもしれない表・前提・計算

## 使わない場面

- 本筋に要る内容（本編に置く）

## ひな形

```html
<section data-pattern="appendix">
  <p class="kicker">Appendix</p>
  <h2>試験導入の 2 チームの内訳</h2>
  <table>
    <thead><tr><th>チーム</th><th class="num">件数</th><th class="num">導入前</th><th class="num">導入後</th></tr></thead>
    <tbody>
      <tr><th>契約</th><td class="num">412</td><td class="num">3 時間 50 分</td><td class="num">45 分</td></tr>
      <tr><th>請求</th><td class="num">388</td><td class="num">4 時間 10 分</td><td class="num">55 分</td></tr>
    </tbody>
  </table>
  <p class="source">出典: 問い合わせ管理の記録（2026 年 9〜10 月）</p>
</section>
```

## 書くときの指示

- `.kicker` に Appendix と書き、本編と区別する
- 文字の量の目安は当てはめないが、文字の大きさは変えない

## よくある失敗

- 本編に入りきらなかった話を、そのまま付録に移す

## 根拠

[共通の規約](../conventions.md) の C3、C11。
