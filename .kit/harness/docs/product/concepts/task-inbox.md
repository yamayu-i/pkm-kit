# Inbox

## 目的

まだ何も決めていないやることを 1 か所に集め、後でまとめて決められるようにする。

## 状態

`clarified`（整理済みか。真偽値）で決める。open で `clarified` でない issue を Inbox と見なす。日付は見ない（締切だけ決まっていて中身が曖昧な issue も Inbox に入る）。Tickler の日を迎えたものも入るが、計画済み（閉じていないサブに期間がある）の Project は Next Action になる。未設定は未整理。サブイシューは Inbox に入らない（親の issue 画面で整理する）。

## 操作

Capture issues か Inbox の入力欄で入れる。Organize で 1 件ずつ決める（Next・Calendar で整理済みになる。Tickler は整理の先送りで、その日に Inbox に戻る）。issue 画面は、Inbox か Next Action かを読み取り専用のバッジで出すだけで、切り替えない（整理は Inbox・Organize で行う。ADR-0210）。「Inbox に戻す」操作は画面にない（MCP の `clarified` だけ。考え直すなら Tickler を付ける）（GTD では in に戻さない。やらなかったものは Next に残し、考え直すなら Tickler にする。[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)）。Someday から open に戻したものは Inbox に入る（Organize で Next・Calendar を選んだときを除く）。

## 使い方の筋道

作った issue は Inbox に入る。Organize で Next（日付を決めない）か Calendar を選ぶと整理済みになり、Inbox から出る。期限を入れただけでは出ない。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0148](../../../../src/docs/adr/0148-inbox-clarified.md)、[ADR-0011](../../../../src/docs/adr/0011-quick-capture.md)、[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)、[ADR-0210](../../../../src/docs/adr/0210-gtd-list-badge-and-project-rules.md)
