# deadline と soft deadline

## 目的

間に合わせなければならない日（deadline）と、できればそれまでに終えたい日（soft deadline）を持ち、近づいたら知らせる。

## 状態

`deadline`、`soft_deadline`（どちらも日付 1 つ）。

## 操作

issue 画面で編集する。Today の期限切れ・期限が近いの表で Change Deadline / Change Soft Deadline。

## 使い方の筋道

3 日前から色が薄い黄色 → 黄色 → オレンジ → 赤（当日）と変わり、過ぎると赤い枠が残る。Today では、過ぎたものが「期限切れ」、3 日以内のものが「期限が近い」に出る。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0009](../../../../src/docs/adr/0009-views.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)
