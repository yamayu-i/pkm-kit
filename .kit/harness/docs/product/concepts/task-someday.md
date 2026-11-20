# Someday

## 目的

いつかやるかもしれないが今は考えたくないものを、日々の画面から外しておく。

## 状態

`status: someday`。任意で `revisit`（見直す日）。Organize で最後に見た日は `reviewed`。

## 操作

Organize の「Someday へ」、status のメニュー。Someday の一覧で見て、週次で見直す（Reviewed で reviewed を今日にする）。

## 使い方の筋道

someday にすると、Calendar の日・期限・Tickler が消え、Today・Scheduled・Issues の既定の表示から消える。revisit を迎えると Organize に出てくる（revisit がなければ Organize には出ず、週次レビューで Someday の一覧から見直す。Organize で Someday に残すと revisit は消える。[ADR-0212](../../../../src/docs/adr/0212-organize-inbox-and-revisit-only.md)）。Calendar の日や期限を入れると open に戻る。Someday から open に戻したもの（status のメニュー・Someday の一覧の Back to Inbox・日付を入れたとき）は Inbox に入り、整理し直す（Organize で Next・Calendar を選んだときは整理済みのまま。[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)）。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)
