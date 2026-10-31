# ADR-0010: 繰り返しタスク（routine, `r-N`）

- 状態: 提案
- 日付: 2026-10-31

## 背景

毎日・毎週のように繰り返すタスクも登録したい。ただし、終わりがあって status が進む issue とは性質が違う。

## 決定（案）

- `routine/r-N.md` に置く。ID は `r-N` の連番（採番と重複の扱いは ADR-0003 と同じ）
- frontmatter:

  ```yaml
  schema: 1
  type: routine
  id: r-3
  summary: 週次レビュー
  repeat:
    every: week        # day | week | month
    interval: 1        # 2 なら隔週
    on: [fri]          # week: 曜日 / month: 日付（[1, 15] や last）/ day: 不要
  start: 2026-11-01    # 任意
  end: 2026-12-31      # 任意
  active: true         # false で一時停止
  group: 夕方          # ボードで最初に入るグループ（任意）
  priority: chore
  label: [生活]
  estimated: 30
  created: 2026-10-31T10:00:00+09:00
  ```

- 本文は手順やチェックリストのメモ
- **出てくるのは task board だけ**。その日が `repeat` に当てはまると、自動でボードに載る。Dead / Caution / Scheduled / Issue List / Inbox / Organize には出ない
- 日ごとの状態（done / skipped）は、その日のデイリーノートの frontmatter（ボードの状態の一部）に持つ。routine の md には書かない
- 再生 / 停止で作る worklog は `task_id: r-N`。実績の按分（ADR-0005）にも含める
- ボードを締めるとき、未完了の routine は「done」か「skip」を選ぶだけ。Reschedule / Cancel / Inbox はない。翌日に持ち越さない
- routine の一覧と作成のために、小さな Routine List の View を用意する

## 理由

- routine は一日ごとに完結するので、status・期限・scheduled を持たせると意味が合わない
- 日ごとの状態を routine の md に書くと、毎日同じファイルを書き換えることになり、コンフリクトしやすい

## 未確定

- 未完了の routine を翌日に持ち越したいことはあるか
- `repeat` の形（上の YAML で足りるか。「毎月第 2 火曜」のような指定は要るか）
- Routine List の View は要るか（md を直接編集するだけで足りるか）
