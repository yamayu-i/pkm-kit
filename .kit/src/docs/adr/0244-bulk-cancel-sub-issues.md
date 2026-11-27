# ADR-0244: issue 画面のサブを一括でキャンセルし、日付を消す

- 状態: 承認
- 日付: 2026-11-27

## 背景

issue 画面の Sub-issues（ADR-0142）で、いらなくなったサブをまとめて canceled にする手段がない。今は 1 件ずつ status のメニューから変えている（#244）。計画を引き直すときに、サブの日付をまとめて消す手段もない

一括の操作は Inbox・Someday・リストの issue にはある（`canApplyAll` と `cancelIssues`）が、サブにはない。

## 決定

### 入口

- Sub-issues の数（`未完了 / 全体`）の右に、一括の操作のアイコンのボタン（Lucide の `list-checks`）を置く。サブが 1 件以上あるときだけ出す
- 押すとダイアログを開く。List・Timeline のどちらの表示でも同じ

### ダイアログ

- 親のサブを、一覧と同じ並び（md に書いた順）で、チェックボックス・status のアイコン（一覧と同じ色）・題の行で出す。Hide closed の状態にかかわらず、すべてのサブを出し、すべて選べる
- 「Select all but closed」は、閉じていないサブ（open・in-progress・waiting・delegated・someday）だけを選ぶ。closed と canceled は選ばない。全部選んでいるときは「Clear selection」になり、選択を外す
- 操作のボタンは 2 つ。どちらも、選んだ中で当てはまるものだけに当て、その件数をボタンに出す。当てはまるものがなければ押せない
  - 「Clear dates N」: 期間（`start` / `end`）か Calendar の日（`scheduled`）を持つサブの、3 つをすべて消す
  - 「Cancel N」: canceled でないサブを canceled にする。選んだ中の canceled は飛ばす
- closed を選んでいるときは、「closed のサブ N 件を canceled にします（完了の記録が変わります）」と出す

### 書き方

- 遷移表（ADR-0183）は変えない。canceled 以外のすべての status から canceled に移れる
- Cancel の付随の変更は 1 件ずつ変えるときと同じ（ADR-0183・0190）: `delegated_to` を消し、期間と `scheduled` は残し、★ を外し、記録中のタイマーを止め、statuslog に 1 件ずつ書く
- Clear dates は status を変えない。日付を消すだけなので、Inbox の Project・Tickler の規則（ADR-0210）にも当たらない
- どちらも親の md は 1 回で書く（`TaskWriter.cancelSubs` / `clearSubDates`）。書く前に、変える全部のサブで検査し、1 件でも通らなければ何も書かない。statuslog・★・タイマーは、書いた後に変わったサブごとに行う（`afterSubStatusChange`）

## 理由

- 今の困りごとは「まとめていらなくする」ことと「計画を引き直す」ことなので、操作を Cancel と Clear dates に絞ると、遷移の例外（Reopen の戻る先がサブごとに違う、delegated は委任先が要る）を扱わずに済む
- 日付を消すときは期間と Calendar の日をそろえて消す。Project を someday にしたときの消し方（ADR-0210）と同じ
- 全選択に closed を含めると、「残りをやめる」つもりで終わったものまで canceled になり、完了の記録（statuslog）が変わる
- 1 回で書くと、途中で失敗して一部だけ canceled になることがない

## 却下した案

- **一覧の行にチェックボックスを出す（選択モード）**: 並べ替えのドラッグ・`…` のメニュー・Timeline とぶつかる
- **status をどれにでも一括で変えられるようにする**: Reopen・delegated の扱いが要り、今の困りごとには要らない。要るようになったら、この ADR を広げる
- **選んだ中に移れないものがあればボタンを押せなくする（`canApplyAll` と同じ）**: Clear dates は canceled のサブにもかけたいので canceled も選べる。選んだものが操作ごとに違うと、ボタンが押せない理由が分かりにくい
- **canceled を選べなくする**: Clear dates を canceled にかけられなくなる
- **期間だけを消し、Calendar の日を残す**: Project を someday にしたときの消し方と違い、計画を引き直したのに Calendar の日だけが残る
- **canceled で期間を消す**: ADR-0190 で、どこまでやったかの記録として残すと決めている

## 影響

- ADR-0142 の Sub-issues の見出しの行に、ボタンが 1 つ増える
- MCP は変えない（`update_sub_issue` を 1 件ずつ呼べば同じことができる）
- サブの `scheduled`（ADR-0152）は残っている。ADR-0203 が止めたのは、サブを持つ親の issue の `scheduled`
- ADR-0183 の付随の変更の表の「サブを canceled にすると期限も消す」は、ADR-0190 で置き換えられている。0183 の本文に置き換えの注記を足す
- 子の Vault のデータは変えないので、移行は要らない。`.kit/changes/` に変更を 1 件書く
