## 変更の要約

- pkm-task: status を変えた後のトーストの取り消しのボタンを「やり直す」から「元に戻す」にした（#35）
- pkm-task: Organize の「予定」「予定を入れる」を Do Date にそろえた（ボタン、スワイプの表示、ダイアログの見出し「Do Date を選ぶ」、取り消しの表示）。一覧の View の名前（Scheduled）は変えていない（#33）
- 所有の境界: 上流が持つプラグインの成果物を ID ごと（pkm-*）に書いた。子の Vault が自分のプラグイン（`.obsidian/plugins/<自分の id>/`）を足しても、境界の検査が失敗しない（#19）
- `verify.mjs`: 最初に Node の版を `mise.toml` と比べ、違えば警告する（止めない）。`--plugin` のときは pnpm の版も比べ、`.kit/src` の依存が揃っていなければ `pnpm check` の前で止める（#49）
- `adr-index.mjs`: 2 つの ADR のディレクトリをまたいで、Issue の番号（ADR-0056 より後）が重なっていたら失敗する（#51）

## 子への影響

- 移行なし
- pkm-task の `main.js` が変わる。取り込んだ後に、PC とモバイルで次を確かめてほしい
  1. task board などで status を変えると、右下のトーストのボタンが「元に戻す ›」になっている。押すと戻る
  2. Organize の右のボタンとスワイプの表示が「Do Date」になり、押すと「Do Date を選ぶ」のカレンダーが開く
- `verify.mjs` が、Node の版が `mise.toml` と違うと警告を出すようになる
