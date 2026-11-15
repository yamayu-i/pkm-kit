# Inbox

## 目的

まだ何も決めていないやることを 1 か所に集め、後でまとめて決められるようにする。

## 状態

`clarified`（整理済みか。真偽値）で決める。open で `clarified` でない issue を Inbox と見なす。日付は見ない（締切だけ決まっていて中身が曖昧な issue も Inbox に入る）。未設定は未整理。サブイシューは Inbox に入らない（親の issue 画面で整理する）。

## 操作

Capture issues か Inbox の入力欄で入れる。Organize で 1 件ずつ決める（Next・Do Date で整理済みになる）。issue 画面の `Inbox` / `Clarified` で切り替えられる。どの画面の「Inbox に戻す」も、`clarified` を外すだけで予定と期限は残す。

## 使い方の筋道

作った issue は Inbox に入る。Organize で Next（日付を決めない）か Do Date を選ぶと整理済みになり、Inbox から出る。期限を入れただけでは出ない。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0148](../../../../src/docs/adr/0148-inbox-clarified.md)、[ADR-0011](../../../../src/docs/adr/0011-quick-capture.md)
