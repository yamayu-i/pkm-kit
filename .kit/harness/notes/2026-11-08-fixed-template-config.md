# 2026-11-08 テンプレートの設定の固定

## つまずき

- 起きたこと: main の改名（vault-* → pkm-*）を merge した後、手元に `.kit/src/packages/vault-*/`（git で追跡していない `node_modules` だけのフォルダ）が残った。`pnpm security:scan` の「危険な API」と「依存の固定」がそれをパッケージとして読み、`src` と `package.json` がないので失敗した
- 改善案: security-scan が `package.json` のないフォルダを飛ばす。または、改名の後に古いフォルダを消すよう dev-handoff か改名の ADR に書く

## つまずき

- 起きたこと: ADR と移行の番号を連番（0039、0007）で付けてから main を取り込み、番号が Issue の番号になったこと（ADR-0056）、変更の記録が `.kit/changes/`、セキュリティの記録が 1 回 1 ファイルになったことに気づいた。番号を 0061 に振り直した
- 改善案: dev-plan の最初で `git fetch origin main` して、main の新しい規則を取り込んでから ADR を書く
