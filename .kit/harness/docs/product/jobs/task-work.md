# 作業しながら、進み具合と時間を残す

- 端末: PC / スマホ
- 望む成果: [1](../strategy.md#望む成果)

## ジョブ

作業に取りかかるとき・終えたとき、手間をかけずに status と使った時間を残したい。後で見積もりと実績を比べ、次の計画に活かせるように。

## 今の流れ

1. [task board](../surfaces/task-board.md) のカードの再生ボタンでタイマーを始める。open の issue は in-progress になる
2. 記録中のタイマーは [Tasks サイドバー](../surfaces/task-sidebar.md) に出て、そこで止められる。PC では、どの画面にいても[ステータスバー](../surfaces/task-status-bar.md)に記録中のタスクと経過時間が出る
3. 終えたら、カードの「次の status」ボタンで closed にする。タイマーも止まる。間違えたら右下のトーストで取り消す
4. 細かいことは [issue 画面](../surfaces/task-issue-screen.md) の本文（ToDo、Note）に書く。worklog も issue 画面で直せる
5. 止め忘れなどの間違ったログは、後で worklog-review で直す（[MCP と task-coach](../surfaces/task-mcp.md)）

## 関わる概念

[status](../concepts/task-status.md)、[worklog とタイマー](../concepts/task-worklog.md)、[estimated](../concepts/task-estimate.md)

## うまくいっている兆し

- closed にした issue の多くに worklog がある
- worklog-review で見つかる止め忘れが減っていく
- 取り消しのトーストが使われる割合が低い（押し間違いが少ない）

## 知られている困りごと

まだない。
