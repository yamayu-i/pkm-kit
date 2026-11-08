# 変更の記録

子の Vault から見える変更と、移行を書く。1 変更 1 ファイル（[ADR-0056](../harness/docs/adr/0056-conflict-free-numbering.md)）。2026-11-08 までの記録は [CHANGELOG.md](../CHANGELOG.md) にある。

- ファイル名: `YYYY-MM-DD-名前.md`（PR を出す日。名前は英小文字・数字・ハイフン。ブランチの作業を表す）。並行する PR が同じファイルに書き足さないので、ぶつからない
- 中身: 見出し（`## 変更の要約`）と箇条書き。移行があれば **移行 NNNN-名前** を先頭に書く。最後に「子への影響」（移行の有無、モバイルで確かめること）を書く
- 1 つの PR に 1 ファイル。PR の中で書き足すのはよいが、マージされたファイルは書き換えない（直すなら新しいファイルを足す）

`vault-upgrade` は、取り込む範囲で増えたファイルを読んで、取り込みの PR の本文を書く（ADR-0010）。

```sh
git diff --name-only --diff-filter=A <前に取り込んだ commit> upstream/main -- .kit/changes/
```
