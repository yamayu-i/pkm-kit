# Do Date

## 目的

その issue をやると決めた日を持ち、その日のボードに出す。期限（間に合わせる日）とは別のもの。

## 状態

`scheduled`: 日付のリスト（複数の日に分けてやれる）。

## 操作

Add Do Date（足す）、Move Do Date（その日を外して移す）、Do Today / Do Tomorrow（決まった日に移す）、Organize の「Do Date」（カレンダーで複数選ぶ）、issue 画面の 7 日ストリップ、Scheduled の表のセル。

## 使い方の筋道

今日が Do Date の issue は、Daily を開くと自動で今日のボードに載る。その日にボードから外したものは載せ直さない。片付かなければ、Do Tomorrow や Move Do Date で移すと、その日のボードでは「持ち越し」になる。

## 根拠

[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)
