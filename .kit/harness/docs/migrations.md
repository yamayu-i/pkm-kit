# 移行の書き方

上流の変更が、子のもの（ノート、`template/`、`.obsidian/*.json`、`.kit-local/` など）に手を入れる必要を生むときは、同じ PR に移行を付ける（[ADR-0010](adr/0010-upstream-updates-and-migrations.md)）。上流のもののファイルだけを変えるなら、移行は要らない（merge で届く）。

## 置き場所と形

`.kit/migrations/NNNN-短い名前/`（英小文字・数字・ハイフン）。番号は、その変更の GitHub Issue の番号（4 桁のゼロ埋め）。連番にしないのは、並行する PR が同じ番号を取らないようにするため（[ADR-0056](adr/0056-conflict-free-numbering.md)。0006 までは連番）。1 つの Issue に移行が 2 つ要るなら、名前で分ける（`0056-foo`、`0056-bar`）。実行は名前の順。並行して作った移行は互いに依存しないので、番号の順とマージの順が違ってもよい

| ファイル | 必須 | 中身 |
|---|---|---|
| `migrate.mjs` | 必須 | `export function migrate(root, { dryRun })`。機械的にできる部分を行い、変えたこと（変える予定のこと）を文の配列で返す。依存なしの Node |
| `check.mjs` | 必須 | `export function check(root)`。終わった状態かを確かめ、残っているものを文の配列で返す（空なら終わり） |
| `README.md` | 必須 | 何が変わったか、なぜか、スクリプトが行うこと、スクリプトで扱えない場合に AI が行うこと、確かめ方 |
| そのほか | 任意 | 共有のコード（`common.mjs`）、基準のデータ（`baseline.json`）など |

実行するのは `.kit/migrate.mjs`（子の `vault-upgrade` と `setup.mjs` が呼ぶ）。`check` が空を返したら、`.kit-local/upstream.json` の `migrations` に記録する。

## 守ること

- **何度実行しても同じ結果**: 2 回目は何も変えない。適用済みの記録を消して実行し直しても、中身は変わらない（CI が確かめる）
- **新しい Vault では何も変えない**: `setup.mjs` は新しい Vault でもすべての移行を実行する（`fresh` の fixture で確かめる）
- **終わったかどうかを機械で判定できる**: 判断が要る部分は AI に任せてよいが、`check.mjs` で終わったことを判定できなければならない。判定できない変更は、Breaking Change として出さない
- **基準を固定する**: 「上流と同じなら」のような比べ方は、移行を書いた時点の上流（`baseline.json` など）と比べる。今の上流と比べると、上流が後で変わったときに結果が変わる
- **DailyNote の本文を変えない**。frontmatter は対象にしてよい
- **子のものを勝手に捨てない**: 読めないファイル（壊れた JSON など）は変えずに、`check` を失敗させて止める。直し方は README に書き、AI がユーザーに確かめる
- 上流は公開リポジトリ。README や fixture に、個人のノートの内容を書かない

## テスト

- `.kit/fixtures/` の子を模した Vault のどれかに、その移行が扱う古い形を足す（[fixture の README](../../fixtures/README.md)）
- `.claude/scripts/test/migrations.test.mjs` は、すべての移行をすべての fixture に実行し、`check` が通ること、2 回目に何も変えないことを確かめる。移行に固有の結果のテストも足す
- `.kit/changes/YYYY-MM-DD-名前.md` に、変更と移行と子への影響を書く（[書き方](../../changes/README.md)）
