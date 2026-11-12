# 2026-11-12 並行する 2 つの PR の ADR の一覧

## つまずき

- 起きたこと: 同じ main から 2 つのブランチを切り、それぞれ ADR（0124・0125）を足して PR を 2 つ出した。片方をマージすると、もう片方が GitHub 上でコンフリクトした。原因は ADR の一覧（`.kit/src/docs/adr/README.md`）で、両方が同じ行（ADR-0120・0121 の状態と、末尾の追加行）を変えていた。手元の `git merge` は `merge=union` で通るため、PR を出す前には気づけなかった。main を取り込み、`adr-index.mjs --write` で作り直して解いた
- 改善案: dev-pr の「最新の main を取り込む」に、「ADR を足す PR を並行して出すと、後の PR は GitHub 上で ADR の一覧がコンフリクトする（union は手元でしか効かない）。先の PR がマージされたら main を取り込んで `adr-index.mjs --write` する」と書く
