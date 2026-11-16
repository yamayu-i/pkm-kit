# ADR-0190: サブイシューの期限を end にまとめ、deadline と soft_deadline をなくす

- 状態: 承認
- 日付: 2026-11-16

## 背景

ADR-0135 で、サブイシューに issue と同じ期限（`soft_deadline` / `deadline`）を持たせた。日付の項目は `start` / `end` / `scheduled` / `soft_deadline` / `deadline` の 5 つになり、Edit の欄・本文のカード・Timeline の印（ADR-0143）・Daily の期限の表（ADR-0150）がそれぞれを扱っている。

使ってみると、サブの期限はほとんど使わない（#190）。

- サブは親の issue の中の一区切りで、期間の終わり（`end`）と別に「間に合わせる日」を持つことは少ない
- 外の都合で決まる締切は、親の issue の `deadline` に書く
- 一方で、`end` を過ぎても何も知らせないので、予定より遅れているサブに気づけない

## 決定

### 項目

- サブの `soft_deadline` / `deadline` をなくす。サブの日付は `start` / `end`（期間）と `scheduled`（Calendar の日。ADR-0152）だけにする
- issue の `soft_deadline` / `deadline` は変えない
- サブの `end` を、そのサブの期限として扱う

### Daily の期限の表（ADR-0150 の Calendar の段階）

- Overdue（`end` が今日より前）と Due soon（`end` が今日から 3 日以内）に、サブを `end` で出す。issue の deadline / soft_deadline の表とは別に、サブだけの表「end」を置く
- 出すサブは今までどおり、active（someday・closed・canceled 以外）で、親が読めているもの
- サブの行の操作は今までどおり Add to today's board だけ。`end` を直すのは親の画面（Timeline・Edit）で行う
- Timeline で `end` をずらすと、警告も変わる（計画を引き直したら、期限も引き直したことになる）

### status と期間（ADR-0183 の付随の変更を置き換える）

- サブを someday にしたら、`delegated_to`・`scheduled`・`start`・`end` を外す。someday は「今はやらない」なので、期間も持たない。戻すときに計画を引き直す
- someday のサブに `start` か `end` を入れたら（同じ変更で status を変えていなければ）、open に戻す。issue で、someday に期限を入れたら open に戻すのと同じ（ADR-0018）。Timeline で棒を作ったときも同じ
- サブを canceled にしても期間は外さない（どこまでやったかの記録として残す。canceled は active でないので、期限の表には出ない）

### 画面

- Edit のダイアログと本文のカードから、Soft deadline / Deadline のチップをなくす
- Timeline（ADR-0143）から期限の印（amber / red の縦の線）をなくす。期間のないサブは、予定日の点だけを出す。日の範囲は `start`・`end`・予定日と今日から決める
- 行の補足（ADR-0142 の `subHint`）は、期間 → 今日以降の Calendar の日の順。期限の「Due …」はなくなる

### MCP

- `create_sub_issues` / `update_sub_issue` から `soft_deadline` / `deadline` をなくす。渡されたら、`end` を使うよう日本語のエラーで返す

### 古い項目の扱いと移行

- md のサブに `soft_deadline` / `deadline` が残っていたら、lint は警告を出す（`sub-deadline-removed`）。読み込みでは無視し、書き換えたときに消える
- 移行 0190 が、既存のサブの `soft_deadline` / `deadline` を `end` にまとめる
  - `end` がないなら、`end` を `deadline`（なければ `soft_deadline`）にする。`start` がその日より後なら、`end` を `start` にする（`end` は `start` より前にできない）
  - `end` があるなら、期限は消すだけにする（期間の終わりを優先する）
  - どちらも、消した期限の値を移行の報告に出す

## 理由

- 日付の項目を 5 つから 3 つに減らすと、欄と Timeline の印が減って読みやすくなる
- `end` を期限として扱うと、予定より遅れているサブに、Daily で気づける
- サブの締切が外の都合で決まるなら、それは親の issue の締切なので、親の `deadline` に書けば足りる
- someday で期間を外すと、someday のサブが期限の表や Timeline に残らない。表に出さない例外を作るより単純

## 却下した案

- **`deadline` だけを残し、`soft_deadline` をなくす**: `end` と `deadline` の 2 つが「終わりの日」として並ぶ問題が残る
- **今のまま 5 つの項目を持つ**: 使われない欄が編集のたびに目に入り、`end` を過ぎても知らせない
- **someday でも期間を残し、期限の表からだけ外す**: someday のサブが Timeline に棒として残り、期限の表に例外が要る
- **移行で `end` と期限の早いほうを `end` にする**: 計画した期間が、使っていなかった期限で変わってしまう

## 影響

- ADR-0135 の項目の表（`soft_deadline` / `deadline`）、ADR-0142・0158 の編集の欄、ADR-0143 の期限の印と日の範囲、ADR-0150 のサブの期限の表、ADR-0183 のサブの付随の変更（someday・canceled で期限を消す）を、この ADR が置き換える
- 子の Vault の issue の md が変わるので、移行 0190 を付ける。`.kit/changes/` に変更を 1 件書く
- プロダクトの概念「deadline と soft deadline」は issue だけのものになる
