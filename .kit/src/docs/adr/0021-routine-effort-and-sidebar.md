# ADR-0021: routine 画面の total / average と左サイドバーのナビゲーション View

- 状態: 承認（一部置換: 0024, 0032）
- 日付: 2026-11-01

## 背景

- routine 画面（ADR-0018）の工数欄は issue 画面にならって `estimated` と `actual` を並べているが、毎日・毎週くり返す routine では累計の `actual` だけでは 1 回（1 日）あたりの実態が分かりにくく、3 列グリッドの 1 列も空いている
- 各 View（Daily / Inbox / Issues / Organize / Scheduled / Someday / Routines / Board groups）はメイン領域のタブで開くだけで、画面を切り替えるにはコマンドパレットやリボンを使う必要がある。未処理の件数や記録中のタイマーを常時見渡せる場所もない

## 決定

### routine 画面の工数欄（total / average）

ADR-0018 の routine 画面の「6. estimated、実績の合計」を次に置き換える。

- 工数タイル（`.vt-effort`）は左から `estimated` / `total` / `average` の 3 列にする（`actual` は出さない）
- `total`: worklog から按分計算した累計時間（`index.effortMinutes(now).get(routine.id) ?? 0`）。読み取り専用
- `average`: `total` を、その routine の有効な worklog（終了時刻が開始時刻より後のもの、または記録中のもの）が存在するユニークな日付数（開始時刻のローカル日付 `YYYY-MM-DD` の種類数）で割った 1 日あたりの平均時間。記録がある日が 0 日のときは `—` を表示する。読み取り専用

### 左サイドバーのナビゲーション View（`vault-task-sidebar`）

ADR-0009 の View 一覧に、左サイドバー常駐用の **Tasks サイドバー**（`vault-task-sidebar`、表示名 `Tasks`、アイコン `check-square`）を追加する。

- **配置と常駐**:
  - レイアウト準備完了時（`workspace.onLayoutReady`）に `vault-task-sidebar` の leaf がまだなければ、`workspace.getLeftLeaf(false)` に開く。Obsidian がワークスペースのレイアウトに保存するため、以降は左サイドバーに常駐する
  - コマンド「Tasks サイドバーを開く」で、左サイドバーの leaf を開いて表示（`revealLeaf`）できる
- **構成（上から順に）**:
  1. **素早い追加**: 「issue をまとめて作成」ボタン（`openCaptureModal` を開く）
  2. **記録中のタイマー**: 現在記録中（`index.running()`）のタスクがある場合、タスクごとの表題（クリックでそのノートを開く）・経過時間・停止ボタンを表示する
  3. **各 View への移動リンクと件数バッジ**:
     - Daily（件数: 期限切れ + 前回のボードの未完了 + 今日の予定 + 今日のボードの未完了）
     - Inbox（件数: Inbox の issue 数）
     - Organize（件数: Organize の対象キューの件数）
     - Scheduled（件数: 今日以降に実行日がある active な issue 数）
     - Issues（件数: active な issue 数）
     - Someday（件数: someday の issue 数）
     - Routines（件数: active な routine 数）
     - Board groups（件数なし）
     - 行をクリックすると `ctx.openView(type)` でメイン領域のタブを開く（既存のタブがあればそれを表示する）

## 理由

- routine は 1 日単位で完結するため（ADR-0010）、worklog がある日数で割った 1 日あたりの平均時間を `estimated` の隣に出すと、見積もりが実態に合っているかすぐ比べられる
- 既存の 8 つの View は一覧表やボードなど横幅を使うためメイン領域のタブに残し、左サイドバーには狭い幅に収まるナビゲーション・件数・タイマーだけを置くことで、どの画面にも 1 クリックで移れる

## 却下した案

- **average を worklog の件数（エントリ数）で割る**: 1 日のうちに中断・再開して worklog が複数に分かれると、1 日あたりの所要時間より小さく出てしまう
- **average をボードで closed にした日数で割る**: タイマーを回さずに closed にした日や、closed にし忘れた日があると、記録した作業時間と分母がずれる
- **既存の View（Daily など）をそのまま左サイドバーに入れる**: ボードの複数列や一覧表はサイドバーの幅では狭すぎて操作しづらい

## 影響

- ADR-0009 の View 一覧に `vault-task-sidebar` が加わる
- ADR-0018 の routine 画面の工数欄が `estimated` / `total` / `average` に変わる
