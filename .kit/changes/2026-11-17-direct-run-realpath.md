## 変更の要約

- 上流の CLI（`.kit/migrate.mjs`、`.kit/setup.mjs`、`.kit/bin/` の stamp-updated・mcp・mcp-hook、`.claude/scripts/` の検査など）が、シンボリックリンクを通ったパスで実行されると何もせずに終わっていたのを直した。直接実行の判定で `process.argv[1]` を realpath してから比べる（yamayu-i/pkm-kit#136）
- macOS では一時フォルダ（`/var/folders/…`）がシンボリックリンクなので、`verify.mjs` の `migrations.test.mjs` のうち CLI を呼ぶテスト 5 件が、取り込みのたびに落ちていた。これが通るようになる
- 子への影響: 移行なし。macOS で `node .claude/scripts/verify.mjs` を実行し、`TMPDIR` を変えなくてもすべて通ることを確かめる
