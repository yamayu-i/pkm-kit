# 委任先（member）

## 目的

誰かに任せた issue について、誰に任せたかを覚えておく。チームで共有するためではない（[戦略](../strategy.md#やらないこと)）。

## 状態

`member/m-N.md`（`name`）。issue の `delegated_to` に ID を入れる。

## 操作

status を delegated にしたときに、名前で探して選ぶ。いなければその場で作る。ボードのカードでは委任先のチップから選び直す。

## 使い方の筋道

delegated にして委任先を選ぶと、カードに名前が出る。delegated 以外に戻すと、委任先は外れる。

## 根拠

[ADR-0007](../../../../src/docs/adr/0007-labels-and-members.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)
