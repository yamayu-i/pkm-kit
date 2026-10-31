# ADR-0002: issue の正本は md の frontmatter。派生値は保存しない

- 状態: 承認
- 日付: 2026-10-31

## 背景

最初の構想では、issue・scheduled・label を jsonl で持ち、必要なら SQLite（.gitignore）に写し、jsonl から frontmatter へ一方向で同期する予定だった。

vault-git は md / txt 以外のファイルで行の変更が重なると、リモート版を採用してローカル版を別名で残す（`src/merge/tree-merge.ts`）。
そのため、jsonl を複数の端末で編集すると、片方の変更が本体から外れやすい。とくに末尾への追記と、日付順の挿入。

## 決定

- issue 1 件 = `issue/i-N.md` 1 ファイル。ディレクトリは平ら
- issue のプロパティの**唯一の正本**は、その md の frontmatter
- 一覧・検索・集計は、プラグインがメモリ上に作る索引で行う（`metadataCache` から作り、`changed` イベントで差分を更新する）
- SQLite は使わない
- 次の値は保存せず、索引で計算する
  - `children`（`parent` から逆引き）
  - scheduled の一覧（各 issue の `scheduled` を集める）
  - `actual_effort`（worklog から計算。ADR-0005）
  - `updated`（ファイルの更新時刻、または git の履歴）
- frontmatter に `schema: 1` を入れ、将来の移行に備える

### frontmatter

```yaml
schema: 1
type: issue
id: i-12
summary: 表題
status: open          # ADR-0006
status-detail: ""     # 20 文字以内の自由記述
delegated_to: m-3     # status が delegated のときだけ（ADR-0007）
priority: mid         # high | mid | low | chore
label: [仕事, 調査]    # 名前で書く（ADR-0007）
parent: i-3
related: [i-5, topics/foo.md]   # issue は ID、それ以外のノートは Vault ルートからのパス
estimated: 120        # 分
scheduled: [2026-11-02, 2026-11-04]
mid_due: 2026-11-05
deadline: 2026-11-10
revisit: 2026-12-01   # someday のときだけ（ADR-0006）
reviewed: 2026-10-31  # Organize で最後に見た日（ADR-0009）
created: 2026-10-31T10:00:00+09:00
```

- `created` は日時（タイムゾーン付き）、それ以外の日付は日付のみ

## 理由

- md なら、コンフリクトしてもマーカーが入るだけで内容は消えない
- 正本が 1 つなら、Obsidian のプロパティ欄・Claude Code・プラグインのどこから編集しても食い違わない
- `metadataCache` は全ノートの frontmatter を解析済みでメモリに持っているので、数千件でも索引を作るのは十分速い
- `updated` を書くと、同じ issue を 2 台で編集したときにその行が必ずコンフリクトし、YAML が壊れる
- `children` や `actual_effort` を保存すると、元の値と必ずずれる

## 却下した案

- **jsonl を正本にして frontmatter に一方向で同期する**：frontmatter を直接直すと上書きされる。jsonl はコンフリクトで変更が外れやすい
- **SQLite を使う**：モバイルでは sql.js（WASM）が必要で、依存とセキュリティチェックの対象が増える。索引はメモリで足りる

## 影響

- issue の中の Markdown リンク以外（frontmatter の ID 参照）は、Obsidian のバックリンクやグラフには出ない
