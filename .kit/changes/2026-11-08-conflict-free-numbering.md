## 並行する PR がぶつからないように、番号の付け方と記録の置き方を変える

- 変更の記録を、`.kit/CHANGELOG.md` に書き足すのをやめ、1 変更 1 ファイルの `.kit/changes/YYYY-MM-DD-名前.md` にした。`.kit/CHANGELOG.md` は 2026-11-08 までの記録として残る（ハーネスの ADR-0056）
- vault-upgrade は、取り込む範囲で増えた `.kit/changes/` のファイルを読んで、取り込みの PR の本文を書く
- 新しい ADR と移行の番号は、その変更の GitHub Issue の番号になる（番号は飛び飛びになる。`.kit/migrations/0056-名前/` など）。移行は今までどおり名前の順に実行され、適用済みは名前で記録される
- ADR の一覧（2 つの ADR ディレクトリの README）は `node .claude/scripts/adr-index.mjs --write` で作るようにした。`verify.mjs` が、一覧が ADR と合っているかを検査する
- 子への影響: 移行はない。子のものは変わらない。`verify.mjs` の検査が 1 つ増えた（上流のものの ADR を見るだけなので、子で失敗するのは上流のものを変えたときだけ）
