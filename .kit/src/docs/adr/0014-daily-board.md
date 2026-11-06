# ADR-0014: DailyTaskView と task board の保存形式・細部

- 状態: 承認（グループの並べ方は [ADR-0015](0015-board-layout-simplified.md)、ボードの状態の保存先は [ADR-0020](0020-board-oplog.md)、「今日の予定」の段階とカードの置き場所は [ADR-0034](0034-duration-input-auto-board-sticky-groups.md) で置換）
- 日付: 2026-10-31

## 背景

ADR-0009 で DailyTaskView の流れと各 View を決めた。実装にあたって、ボードの保存形式や、片付けたことの記録など、細部を決める必要があった。

## 決定

### ボードの状態

その日のデイリーノート `daily/YYYY/MM/YYYY-MM-DD.md` の frontmatter の `board` に置く（なければ作る）。

```yaml
board:
  issues: [i-6, i-1, i-2]         # ボードに載せた issue（載せた順）
  groups: { i-6: 午前/集中, r-1: 午前 }   # カードのグループ（ないものは未分類）
  routines: { r-1: closed }       # routine のその日の結果（closed / canceled）
  carried: [i-1]                  # リスケ / Inbox で片付けた issue
  closed: true                    # 締めたか
```

- **未完了** = ボードの issue のうち、closed / canceled / someday でもなく `carried` にも入っていないもの + 結果のない routine
- ボードの issue を Reschedule / Inbox にしたときは、ボードには残したまま `carried` に入れる（その日の記録として残すため）。Close / Cancel は status で分かるので `carried` には入れない
- 未完了が 0 になったら締められる。締めると、デイリーノートの本文の `## Task board` 節に要約（完了・持ち越し・worklog）を Markdown リンク付きで書く（あれば置き換える）
- 過去のボードで未完了が残っているものは「前回のボード」に出す。未完了がなくなった過去のボードは、DailyTaskView を開いたときに自動で締める

### DailyTaskView

- 段階: 期限切れ → 前回のボード → 期限が近い → 今日の予定 → ボード。上の段階表示からいつでも移れる
- 期限切れ・前回のボード・今日の予定は、片付くと自動で次へ。期限が近いは「次へ」で進む
- 前回のボードと今日のボードの未完了には、ADR-0009 の Reschedule / Cancel / Inbox に加えて **Close** を置く（終わっていたのに status を変え忘れていたもの）

### task board のグループ

- 定義は `issue/board-groups.json`（全端末で共有する）。`[{ "name": "午前", "span": 2, "children": [{ "name": "集中" }] }]`
- 2 階層まで。グループ名に `/` は使えない（カードの置き場所を `親/子` で表すため）
- ボードは横 4 段。グループごとに `span`（1〜4 段）を選ぶ。子グループはグループの中に横に並ぶ。狭いペインでは 1 列
- routine は `group` の欄が既定の置き場所。カードを別のグループへ移すと、その日のボードの `groups` に入る
- グループの名前を変えても、過去のボードの置き場所は移さない（未分類に出る）

### タイマー

- 再生で worklog を追記する（`to: null`）。停止で `to` を今にする。どちらも `vault.process` で行う
- worklog の ID は `wl_` + 英数字 10 文字
- 端末名（worklog のフォルダ名）はプラグインの設定（data.json、git に入れない）。初期値は vault-git の端末名

### 端末ごとの設定

- `.obsidian/plugins/vault-task/data.json` に端末名と、Issue List の保存した条件を置く。`.gitignore` に入れる

## 理由

- ボードの状態をデイリーノートに置くと、その日の記録として人も LLM も読める。ファイルは日ごとに分かれるので、端末間でぶつかりにくい
- リスケした issue をボードから消すと、その日に何を持ち越したかが分からなくなる
- グループの定義は毎日同じものを使うので、日ごとではなく 1 つのファイルにする

## 却下した案

- **ボードの状態を別の JSON（`board/2026-10-31.json`）に置く**: デイリーノートと記録が分かれる。JSON はコンフリクトするとリモート優先になる
- **グループの定義を data.json に置く**: 端末ごとにばらばらになる
