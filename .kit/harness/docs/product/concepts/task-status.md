# status

## 目的

やることが今どこにあるかを、1 つの値で表す。

## 状態

`status`: open / in-progress / waiting / delegated / someday / closed / canceled。それぞれに色と ○ を土台にしたアイコンがある。補足は `status-detail`（20 文字以内）。変化は `statuslog/` に追記される（分析用。正本は frontmatter）。

## 操作

バッジのメニューで選ぶ。ボードのカードでは「次の status」ボタンで 1 クリックで進める。変えた直後は右下のトーストでまとめて取り消せる。

## 使い方の筋道

タイマーを始めると open は in-progress になる。closed か canceled にすると、記録中のタイマーが止まる。someday にすると Do Date と期限が消える（[Someday](task-someday.md)）。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)
