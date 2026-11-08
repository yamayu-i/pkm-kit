# 移行の fixture

上流の CI（`.claude/scripts/test/migrations.test.mjs`）が、すべての移行をここの子の Vault に実行して、`check.mjs` が通ることと、2 回目に何も変えないことを確かめる（ADR-0010）。上流は公開リポジトリなので、汎用の内容だけを置く。

| fixture | 模しているもの |
|---|---|
| `fresh/` | 今の上流でセットアップした直後の新しい Vault。`template/` がなく、`.obsidian/` は今の上流が求める設定どおり。どの移行も何も変えないこと（テストで確かめる） |
| `legacy/` | 切り出す前から使っている Vault。上流と同じ中身の `template/` がそのまま残っている。`.obsidian/` は切り出した時点の設定（コアプラグインのデイリーノートが有効、既定の `daily-notes.json`、`mid_due` の型を持つ `types.json`）。`issue/` に旧名の `mid_due` を持つ issue がある。`member/` に `nickname` と `alias` のない member（と、すでに持つ member）がある |
| `customized/` | テンプレートを変えた Vault。変えたもの・子だけのもの・変えていないものと、差分と並べ替えのある完全な形の `template/config.json`。`daily-notes.json` の値も変えている。旧名（`vault-*`）のプラグインのホットキーを持つ `hotkeys.json` と、`vault-theme` と子のスニペットを有効にした `appearance.json` がある |

移行を足したら、その移行が扱う古い形を、どれかの fixture に足す。
