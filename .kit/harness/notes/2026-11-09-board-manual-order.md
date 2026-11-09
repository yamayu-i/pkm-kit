# 2026-11-09 task board の手動の並べ替え

## つまずき

- 起きたこと: クラウドの環境で `pnpm check` を流すと、各パッケージの vitest が並列に同じ `.kit/src/node_modules/.vitest-cache` を消し合い（ENOTEMPTY）、design・pkm-diagram などのテストが起動前に失敗した。`pnpm -r --workspace-concurrency=1 test` で順に流すと通った
- 起きたこと: 1 回目の並列の失敗で design の `repo.test.ts`（CSS のデザインルールの検査）が動かず、足した box-shadow の規則違反に気づくのが main の取り込みの後になった（手戻り）
- 改善案: vitest の cacheDir をパッケージごとにするか、`pnpm test` を `--workspace-concurrency=1` にする。dev-implement に「起動前の失敗（Startup Error）は通ったことにならない。順に流し直す」と書く

## 食い違い

- 起きたこと: クラウドの環境では `pnpm --filter pkm-task preview:ui` が Playwright の版の違う Chromium しか見つけられず失敗した。`CHROMIUM_PATH=/opt/pw-browsers/chromium` で通った（preview.mjs のコメントには書いてあるが、上流の CLAUDE.md のコマンドの欄にはない）
- 改善案: コマンドの欄か plugin-development の文書に、`CHROMIUM_PATH` の指定を書く

## つまずき（ADR の一覧）

- 起きたこと: ADR の README の一覧を手で 1 行足したら、`adr-index` の検査が「一覧が ADR と合っていない」で失敗した。一覧は ADR のタイトルから作るもので、`node .claude/scripts/adr-index.mjs --write` で作り直すと通った
- 改善案: dev-plan の「ADR を書く」に、一覧は手で書かず `adr-index.mjs --write` で作ると書く
