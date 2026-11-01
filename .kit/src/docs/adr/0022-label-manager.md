# ADR-0022: label を編集する画面（Labels）

- 状態: 承認
- 日付: 2026-11-01

## 背景

- label の定義は `issue/labels.json`（ADR-0007）にあるが、プラグインからは issue の label 欄で「新しい label を足す」ことしかできない。名前と色を変える・並べ替える・消すには JSON を手で書き換える必要がある
- ADR-0007 は「label を改名するときは、プラグインが全 issue の `label` を書き換える」としているが、その操作を行う画面がない
- routine も `label` 欄を持つ（schema の `Routine.labels`）が、ADR-0007 の改名の対象には書かれていない

## 決定

### View

ADR-0009 の View 一覧に **Labels**（`vault-task-labels`、アイコン `tag`）を追加する。Board groups（ADR-0015）と同じく、下書きを編集して「保存」でまとめて書き込む。

- 一覧の行: 色（カラーピッカーと `#rrggbb` の入力欄）、名前、プレビューのバッジ、使っている issue / routine の件数、上へ / 下へ / 削除
- できること: 追加、改名、色の変更、並べ替え（labels.json の順がそのまま表示の順になる）、削除
- 名前の検査: 空、前後の空白を除いて同じ名前がある場合はエラー
- 色の検査: `#` と 3 / 6 / 8 桁の 16 進でない、または `--vt-on-label` との比が 4.5:1 未満（`low-contrast-label` と同じ基準。docs/design.md）ならエラー
- エラーがある間は保存できない。未保存の変更があるときはバナーを出し、「元に戻す」で索引の状態に戻せる
- 新しい label の色の初期値は `DEFAULT_LABEL_COLOR`
- `labels.json` に読めない定義がある（索引に `invalid-labels` の問題がある）ときは保存しない（`addLabel` と同じ。書き戻すと読めなかった定義が消えるため）

### 改名

- 保存のとき、改名した label を、その label が付いている **issue と routine の両方**の `label` 欄で書き換える（ADR-0007 の改名の対象に routine を足す）
- 書き換えた結果、同じ名前が重なる場合は 1 つにまとめる
- 書き込みの順は「issue / routine の書き換え → `labels.json`」。途中で失敗しても、もう一度保存すれば残りが書き換わる（改名の元の名前が `labels.json` に残っているため）

### 削除

- issue か routine で使われている label は削除できない（削除ボタンを無効にし、理由をツールチップに出す）。使われていない label だけを消せる
- 書き込み側でも、保存の直前に使われていないことを確かめる

### 左サイドバー

- Tasks サイドバー（ADR-0021）のナビゲーションの、Board groups の下に Labels を足す（件数なし）

## 理由

- 改名と削除を JSON の手作業に任せると、issue 側の `label` が取り残されて `unknown-label` の警告になる
- 使われている label を消すと、issue 側に定義のない label が残るか、issue の内容を知らないうちに変えることになる。消せないようにすれば、先に issue 側で外すという明示的な手順になる
- routine の `label` も同じ名前の集合を使うので、issue だけ書き換えると routine に古い名前が残る
- 色のコントラストは `pnpm task:lint` で検査しているが、保存してから lint で気づくより、入力した場所で止めた方が直しやすい
- Board groups と同じ「下書き → 保存」にすると、改名の途中の名前で issue を何度も書き換えずに済む

## 却下した案

- **削除したら issue / routine の `label` からも外す**: issue の内容を一括で消すことになり、取り消しにくい
- **削除しても issue 側はそのまま残す**: `unknown-label` の警告が残り、labels.json にない label を探して直す手間が増える
- **改名の対象を issue だけにする**（ADR-0007 の文言どおり）: routine に古い名前が残る
- **入力のたびに即保存する**: 改名の入力中に、全 issue を 1 文字ごとに書き換えることになる

## 影響

- ADR-0009 の View 一覧に `vault-task-labels` が加わる
- ADR-0007 の改名の対象に routine が加わる
- ADR-0021 のサイドバーのナビゲーションに Labels が加わる
