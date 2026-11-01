# ADR-0009: View の一覧と各 View の振る舞い

- 状態: 承認
- 日付: 2026-10-31

## 決定

### 共通

- どの View でも、issue をクリックすると issue 画面を開く
- 一覧の行に出すもの: ID（status 色のバッジ）、summary（はみ出しは省略）、priority、status、画面ごとの列（ADR-0018）

### DailyTaskView

次の順に進む。どの段階もスキップできる。

1. dead issue（deadline / mid_due が今日より前。別々の表）: 全部片付けたら次へ
2. 前回のボードが片付いていない場合: 未完了を片付ける。何日も開かなかったときは、最後に締めたボードの日付から溜まった分をまとめて扱う
3. caution（deadline / mid_due まで 3 日以内。別々の表）: 「次へ」で進める
4. 今日の scheduled: 全部片付けたらボードへ
5. task board

- アクション: Reschedule（dead / caution では期限、scheduled とボードでは実行日のリスケ）、Cancel、Inbox（期限と実行日をクリア）、Move to Task Board
- ボードの状態（どの issue をどのグループに置いたか、締めたかどうか）は、その日のデイリーノート `daily/YYYY/MM/YYYY-MM-DD.md` の frontmatter に持つ
- ボードを締めるとき、その日の worklog の要約と完了した issue を、デイリーノートに Markdown リンク付きで書き出す

### Issue List

- summary と ID で検索する
- 絞り込み: status、priority、label、parent、期限の範囲、scheduled の有無
- 各列で並び替える
- 既定では closed / canceled / someday を隠す
- よく使う条件をプリセットとして保存できる
- 件数が多いときはページングする

### Inbox

- Inbox（ADR-0006）の一覧
- 上部に、summary だけで issue を作れる入力欄を置く

### Someday List

- someday の一覧。`reviewed` が古い順に並べる並び替えがある

### Scheduled

- 行: 今日以降に scheduled がある issue（closed / canceled / someday は除く）
- 列: 左に summary を固定し、右に今日から 14 日分の日付を並べる（横スクロール）
- セルをクリックすると、その日の予定の on / off を切り替える
- mid_due / deadline の枠色と、締切を過ぎた日の塗りは、issue 画面の 7 日ストリップと同じ部品を使う

### Organize

- スキマ時間に、Inbox と Someday を 1 件ずつカードで整理する
- 出てくる順: Inbox の古い順 → someday のうち `revisit` を過ぎたもの → `reviewed` が古い someday
- カードに出すもの: summary、作成日、本文の冒頭数行。priority と label はカード上で変えられる
- 操作（スワイプとボタンの両方。PC ではボタンとキーボード）:
  - 右: 予定を入れる（今日 / 明日 / 今週 / 日付を選ぶ）。Inbox から予定を入れるときは estimated も入れる
  - 左: Someday へ
  - 上: あとで（`reviewed` だけ更新してスキップ）
  - 下: Cancel
  - ボタン: Closed（もう終わっていた）、開く
- 直前の操作を 1 つ取り消せる
- 「5 件で一区切り」のように、スキマ時間で終わる単位を表示する
- 整理したカードは `reviewed` を今日にする
- スワイプはライブラリを使わず pointer events で実装する

### タイマー

- 止め忘れの警告や自動停止はしない。間違ったログは後でスキル（`worklog-review`）で直す

### worklog-review スキル

`.claude/skills/worklog-review/` に置く。CLI で候補を出し、1 件ずつ修正案を出して、承認されたら jsonl を書き換える。

検出する候補:
- `to` が空のまま一定時間以上経っている
- 1 件が N 時間を超える
- 日をまたいでいる
- `to` が `from` 以前、または長さが 0
- 重なりが多い（k が 3 以上など）
- closed になった後のログ
- 存在しない `task_id`
