# ADR-0135: issue の親子関係を廃止し、issue の md の中にサブイシューを持つ

- 状態: 承認（一部置換: 0152）
- 日付: 2026-11-15

## 背景

issue の親子関係（`parent`。ADR-0002, 0012）は、親と子が別々のファイル（`issue/i-N.md`）になる。全体像を 1 か所で見られず、まとめて直しにくく、子の数だけ ID が増える。PM に要る期間（開始・終了）と依存関係も持てない（Issue #134 §3.4、#135）。

## 決定

### 親子関係を廃止する

- issue の `parent` と、それを前提にした索引（`childrenOf`、`ancestors`、`canSetParent`）・一覧の絞り込み・issue 画面の Parent / Children 欄・MCP の `parent` 引数・lint の検査（`self-parent`、`dangling-parent`、`parent-cycle`）を削除する
- 代わりに、issue の md の本文の末尾にサブイシューを持つ。サブのサブ（ネスト）は持たない

### 書式

本文の末尾に、サブ 1 件ごとに HTML コメントのブロックを置き、その後ろにサブの本文を書く。

```markdown
## Note

<!-- sub-issue
id: k3f9a2
summary: 仕様を決める
status: in-progress
start: 2026-11-16
end: 2026-11-20
estimated: 120
created: 2026-11-15T10:00:00+09:00
-->
サブの本文（ふつうの Markdown）

<!-- sub-issue
id: p8d2mz
summary: 実装する
status: open
depends_on: [k3f9a2]
created: 2026-11-15T10:05:00+09:00
-->
```

- サブの並びは、md の中に書いた順番。並べ替えは、ブロックごと順番を入れ替えて保存する（並びの項目は持たない）
- 行頭の `<!-- sub-issue` がマーカー。最初のマーカーより後ろはすべてサブの領域で、親の本文はその前で終わる
- コメントの中は YAML（frontmatter と同じ規則）。`-->` までがサブの項目、その後ろから次のマーカー（なければファイルの終わり）までがサブの本文
- 値に `-->` を含めない。サブの本文の行頭に `<!-- sub-issue` を書かない。プラグインと CLI の writer は、これらを受け付けない
- HTML コメントは素の Markdown のうちで、wiki リンクのような Obsidian 独自の書式ではない（`vault-conventions.md` に合う）。読み取り表示では項目が隠れ、本文の `---` とも衝突しない

### サブイシューの項目

| 項目 | 型 | 意味 |
|---|---|---|
| `id` | 文字列（必須） | 英小文字と数字の 6 文字。一意なのは同じ親の中だけ |
| `summary` | 文字列（必須） | 題。issue と同じ名前 |
| `status` | issue と同じ 7 状態（必須） | ADR-0006 |
| `delegated_to` | `m-N` | status が delegated のときだけ（ADR-0007, 0032 と同じ規則） |
| `start` / `end` | 日付 | ガントチャートの期間 |
| `scheduled` | 日付のリスト | 作業する予定の日（issue と同じ） |
| `soft_deadline` / `deadline` | 日付 | issue と同じ |
| `estimated` | 分 | issue と同じ |
| `depends_on` | サブの `id` のリスト | 同じ親の中のサブだけ |
| `created` | 日時 | 作った日時 |
| `migrated_from` | `i-N` | 移行で子の issue から変換したときの元の ID（下の「移行」） |

- 持たない: `priority`、`label`、`related`、`status-detail`、`revisit`、`reviewed`、`repeat`（routine の項目）
- サブの外からの参照は、合成キー `i-12#k3f9a2` で書く（親の ID と `#` とサブの `id`）

### 規則

- 親の status は、サブの status から自動では変えない。サブがすべて closed でも親は閉じない（#134 §8.3）
- 見積もり: 親の `estimated` は全体の予算、サブの `estimated` は内訳。親の値にサブを足さない
- 実績: worklog の 1 行を 1 回だけ数える。親の実績 = 親に直接付けた行 + サブに付けた行（重複なし）。サブの実績 = そのサブに付けた行
- `depends_on`: 存在しないサブ、自分自身、循環を lint のエラーにする。依存先の `end` より前に `start` があるものは警告にする
- `id` は writer が振る。同じ親の中で重なったら振り直す。lint は重なりと書式をエラーにする

### jsonl での参照

正本は md だけで、サブ専用の jsonl は作らない。

- worklog: 従来の `task_id`（親の `i-N`）に加えて、サブで記録した行は `sub`（サブの `id`）を持つ。`sub` のない既存の行は親に直接付けた行のまま
- statuslog: サブの status の変化は、`task`（親の `i-N`）と `sub` の組で記録する
- board: ボードの項目は 1 つの文字列（daily の frontmatter と `order` の `tasks`）なので、サブは合成キー `i-12#k3f9a2` で持つ
- 削除したサブを指す行は消さない。集計では親に含め、表示は「削除済み」にする。lint は警告にとどめる

### 移行（`parent` を持つ issue）

`.kit/migrations/0135-sub-issues/` で、`parent` を持つ issue（子）を、親の md のサブに変換する。

- 子の `summary`・`status`・`delegated_to`・`scheduled`・`soft_deadline`・`deadline`・`estimated`・`created` をサブの項目に写し、`migrated_from` に子の ID を入れる。子の本文はサブの本文にする
- サブが持たない項目（`priority`、`label`、`related` など）に値があれば、捨てずに、サブの本文の先頭に 1 行で残す
- 孫（子の子）は、いちばん上の祖先のサブにする（ネストを持たないため）
- 子のファイルは削除する。ID は再利用しない
- worklog・statuslog・board の jsonl は書き換えない（追記だけの記録のため）。索引は、`migrated_from` から、旧 ID の行をそのサブの行として読む
- ほかの issue の `related` にある子の ID は、合成キーに書き換える
- `--dry-run` で、変換する子と残す値を一覧にする

### 範囲外（後の Issue で決める）

画面（親の issue 画面のヘッダの一覧、本文の後ろのアコーディオン、編集のダイアログ）、ガントチャート、タイマーの切り替え、DailyTaskView での期限の出し方は、この決定の上に、それぞれの実装の Issue で決める。

## 理由

- 親とサブが 1 ファイルなら、全体像を 1 か所で読み書きでき、Claude Code からも 1 ファイルを読むだけで済む
- サブの `id` を親の中だけで一意にすると、短い ID で足り、連番の採番（ADR-0003）とぶつからない
- HTML コメントは、Obsidian の読み取り表示で隠れ、パースの境界がはっきりする
- 項目名を issue と揃えると、同じ項目名は同じ型にする規約に合い、索引と集計のコードを共用できる
- jsonl を書き換えないことで、端末ごとの追記だけの記録（ADR-0004, 0020, 0031）を守れる

## 却下した案

- **`---` でサブの項目を区切る**: 本文の水平線と区別できず、frontmatter と見分けにくい
- **専用のコードフェンス（```` ```sub-issue ````）に項目を書く**: 読み取り表示で項目が見えたままになる。本文をフェンスの中に入れると Markdown として描画されない
- **親子関係を残し、サブも足す**: 親子とサブの 2 つの仕組みが並び、どちらを使うか毎回迷う
- **サブを nano-id だけで全体一意にする**: 長い ID が要り、jsonl やボードで親が分からない
- **jsonl も合成キーにそろえる（worklog・statuslog）**: 既存の `task_id` の意味（issue か routine の ID）が変わり、読む側すべてに影響する。board だけは文字列 1 つの構造のため合成キーにした
- **移行で jsonl の旧 ID を書き換える**: 追記だけの記録を書き換えることになり、同期中の端末とぶつかる

## 影響

- 索引は metadataCache の frontmatter だけでなく、issue の本文を読む（`cachedRead`）。変更のたびに、その issue だけ読み直す
- 2 台で同じ親の別々のサブを直したときは、行の単位で merge される。同じサブの項目がぶつかって YAML が壊れたら、そのサブを lint のエラーにし、捨てずに読めない状態で表示する
- ADR-0002（`children` の記述）、ADR-0009（parent の絞り込み）、ADR-0012（Parent / Children 欄）は、この ADR で一部置換になる
- MCP の `create_issue` / `update_issue` から `parent` を外し、サブの操作を足す。`task-coach` と `worklog-review` のスキルも直す
- 子の Vault のノートに手を入れるので移行を付け、`.kit/changes/` に書く
