# ADR-0244: issue 画面のサブを一括でキャンセルする

- 状態: 提案
- 日付: 2026-11-27

## 背景

issue 画面の Sub-issues（ADR-0142）で、いらなくなったサブをまとめて canceled にする手段がない。今は 1 件ずつ status のメニューから変えている（#244）。

一括の操作は Inbox・Someday・リストの issue にはある（`canApplyAll` と `cancelIssues`）が、サブにはない。

## 決定

### 入口

- Sub-issues の数（`未完了 / 全体`）の右に、一括の操作のアイコンのボタン（Lucide の `list-checks`）を置く。サブが 1 件以上あるときだけ出す
- 押すとダイアログを開く。List・Timeline のどちらの表示でも同じ

### ダイアログ

- 親のサブを、一覧と同じ並び（md に書いた順）で、チェックボックス・status のアイコン・題の行で出す。Hide closed の状態にかかわらず、すべてのサブを出す
- canceled のサブはチェックできない（もう canceled なので変えるものがない）
- 「Select all」は、閉じていないサブ（open・in-progress・waiting・delegated・someday）だけを選ぶ。closed は選ばない。もう一度押すと選択を外す
- closed のサブは、個別にチェックすれば canceled にできる。「やった」記録を書き換えることになるので、選んだ中に closed があるときは、ボタンの上に「closed のサブ N 件を canceled にします」と出す
- 操作のボタンは「Cancel N sub-issues」だけ。選んでいないときは押せない
- 一括でできる操作は、今は Cancel だけにする

### 書き方

- 遷移表（ADR-0183）は変えない。canceled 以外のすべての status から canceled に移れる
- 付随の変更は 1 件ずつ変えるときと同じ（ADR-0183・0190）: `delegated_to` を消し、期間（`start` / `end`）と `scheduled` は残し、★ を外し、記録中のタイマーを止め、statuslog に 1 件ずつ書く
- 親の md は 1 回で書く（`TaskWriter.updateSubs`）。書く前に、変える全部のサブで検査し、1 件でも通らなければ何も書かない。statuslog・★・タイマーは、書いた後に変わったサブごとに行う（`afterSubStatusChange`）

## 理由

- 今の困りごとは「まとめていらなくする」ことなので、操作を Cancel に絞ると、遷移の例外（Reopen の戻る先がサブごとに違う、delegated は委任先が要る）を扱わずに済む
- 全選択に closed を含めると、「残りをやめる」つもりで終わったものまで canceled になり、完了の記録（statuslog）が変わる
- 1 回で書くと、途中で失敗して一部だけ canceled になることがない

## 却下した案

- **一覧の行にチェックボックスを出す（選択モード）**: 並べ替えのドラッグ・`…` のメニュー・Timeline とぶつかる
- **status をどれにでも一括で変えられるようにする**: Reopen・delegated の扱いが要り、今の困りごとには要らない。要るようになったら、この ADR を広げる
- **選んだ中に移れないものがあればボタンを押せなくする（`canApplyAll` と同じ）**: Cancel では canceled 以外はすべて移れるので、canceled を選べなくすれば足りる
- **canceled で期間を消す**: ADR-0190 で、どこまでやったかの記録として残すと決めている

## 影響

- ADR-0142 の Sub-issues の見出しの行に、ボタンが 1 つ増える
- MCP は変えない（`update_sub_issue` を 1 件ずつ呼べば同じことができる）
- ADR-0183 の付随の変更の表の「サブを canceled にすると期限も消す」は、ADR-0190 で置き換えられている。0183 の本文に置き換えの注記を足す
- 子の Vault のデータは変えないので、移行は要らない。`.kit/changes/` に変更を 1 件書く
