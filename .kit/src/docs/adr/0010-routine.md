# ADR-0010: 繰り返しタスク（routine, `r-N`）

- 状態: 承認
- 日付: 2026-10-31

## 背景

毎日・毎週のように繰り返すタスクも登録したい。ただし、終わりがあって status が進む issue とは性質が違う。

## 決定

- `routine/r-N.md` に置く。ID は `r-N` の連番（採番と重複の扱いは ADR-0003 と同じ）
- frontmatter:

  ```yaml
  schema: 1
  type: routine
  id: r-3
  summary: 週次レビュー
  repeat:
    every: week        # day | week | month
    interval: 1        # 省略時 1。2 なら隔週・隔月
    on: [fri]          # 下の表
  start: 2026-11-01    # 任意。interval の起点にもなる（省略時は created の日付）
  end: 2026-12-31      # 任意
  active: true         # false で一時停止
  group: 夕方          # ボードで最初に入るグループ（任意）
  priority: chore
  label: [生活]
  estimated: 30
  created: 2026-10-31T10:00:00+09:00
  ```

- `on` の書き方:

  | every | 書ける値 | 例 |
  |---|---|---|
  | `day` | 不要 | |
  | `week` | 曜日 `mon`〜`sun` | `[mon, thu]` |
  | `month` | 日付 `1`〜`31`、月末 `last`、第 N 曜日 `<N>th-<曜日>`（N は 1〜5）、最終曜日 `last-<曜日>` | `[1, 15]`, `[2th-tue]`, `[last-fri]` |

  - `1st` / `2nd` / `3rd` も `1th` / `2th` / `3th` と同じに扱う
  - その月にない日付（2 月の 30 日など）や、第 5 曜日がない月は、その月は出てこない（月末にしたいなら `last`）
  - 隔週は `start` の週（月曜始まり）から数える。隔月は `start` の月から数える
- 本文は手順やチェックリストのメモ
- **出てくるのは task board だけ**。その日が `repeat` に当てはまると、自動でボードに載る。Dead / Caution / Scheduled / Issue List / Inbox / Organize には出ない
- 日ごとの状態は、その日のデイリーノートの frontmatter（ボードの状態の一部）に持つ。routine の md には書かない
- **その日のうちに closed か canceled のどちらかにする**。翌日に持ち越さない。ボードを締めるときに、未完了の routine はどちらかを選ぶ
- 再生 / 停止で作る worklog は `task_id: r-N`。実績の按分（ADR-0005）にも含める
- routine を一覧・作成・一時停止する **Routine List** の View を用意する

## 理由

- routine は一日ごとに完結するので、status・期限・scheduled を持たせると意味が合わない
- 日ごとの状態を routine の md に書くと、毎日同じファイルを書き換えることになり、コンフリクトしやすい
- 「毎月第 2 火曜」のような指定を、RRULE より短く書ける独自表記にした
