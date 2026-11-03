# 移行の fixture

上流の CI（`.claude/scripts/test/migrations.test.mjs`）が、すべての移行をここの子の Vault に実行して、`check.mjs` が通ることと、2 回目に何も変えないことを確かめる（ADR-0010）。上流は公開リポジトリなので、汎用の内容だけを置く。

| fixture | 模しているもの |
|---|---|
| `fresh/` | セットアップした直後の新しい Vault。`template/` がない |
| `legacy/` | 切り出す前から使っている Vault。上流と同じ中身の `template/` がそのまま残っている |
| `customized/` | テンプレートを変えた Vault。変えたもの・子だけのもの・変えていないものと、差分と並べ替えのある完全な形の `template/config.json` |

移行を足したら、その移行が扱う古い形を、どれかの fixture に足す。
