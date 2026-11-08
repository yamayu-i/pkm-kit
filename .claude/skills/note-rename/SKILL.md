---
name: note-rename
description: 日本語などのタイトルで作ったノートのファイル名だけを、英語のケバブケースに改名する手順。title は日本語のまま残し、そのノートを指すリンク（DailyNote の本文を含む）を書き換えて、main に直接コミットする。ユーザーが「ファイル名を英語にしたい」「改名を進めて」と頼んだとき、wiki-lint が改名を待っているノートの件数を出し、ユーザーが改名を頼んだときに使う。
---

# ノートのファイル名を英語にする

ノートは日本語のタイトルを入力するだけで作る（入力した文字がファイル名と `title` になる）。LLM wiki として扱いやすくするため、あとでファイル名だけを英語のケバブケース（英小文字・数字・ハイフン）に改名する。`title` は変えない（[ADR-0015](../../../.kit/harness/docs/adr/0015-english-file-names.md)）。

頼まれたときだけ行う。改名とリンクの書き換えは、手で行わずにスクリプトで行う。

## 1. 同期を済ませる

```sh
git switch main && git pull --rebase origin main
```

ほかの端末（スマホなど）で、改名するノートを編集中でないかをユーザーに確かめる。編集中のものがあれば、同期が済んでから行うか、対象から外す。

## 2. 対象を挙げる

```sh
node .claude/scripts/note-rename.mjs --list
```

`daily/`、`issue/`、`routine/`、`member/`、`asset/`、`tmp/`、`template/`、`sources/`、隠しパス、`README.md` は対象にならない。件数が多いときは、ユーザーと相談して一度に扱う数を決める（目安は 20 件まで）。

## 3. 英語の名前の案を作り、確かめる

1. 対象のノートを読み、内容を表す短い英語の名前を考える。ケバブケースで、フォルダは変えない（`note/会議メモ.md` → `note/weekly-meeting-notes.md`）
   - 意味の分かる名前にする。ローマ字にしない
   - 同じフォルダの既存のファイルと重ならないようにする
2. 対応表を表にしてユーザーに見せ、確かめてもらう。直された名前はそのとおりにする。ユーザーが外したノートは対応表に入れない
3. 確かめた対応表を `tmp/note-rename.json` に書く（`{ "もとのパス": "新しいパス" }`）。`tmp/` は git で管理しない

## 4. 予定を確かめてから改名する

```sh
node .claude/scripts/note-rename.mjs --apply tmp/note-rename.json --dry-run
node .claude/scripts/note-rename.mjs --apply tmp/note-rename.json
```

- `--dry-run` は、改名するノートとリンクを書き換えるノートを出すだけで、何も変えない
- スクリプトは、改名・`title` の追加（なければ、もとのファイル名を入れる）・Vault のすべてのノートのリンク先のパスの書き換えを行う。DailyNote の本文も、リンク先のパスだけは書き換える（ADR-0015 の例外）
- 「改名できない」と出たら、何も変わっていない。理由を見て対応表を直す。元資料（`sources/`）から指されたノートは改名できないので、ユーザーに伝えて対象から外す

## 5. 検査してコミットする

```sh
node .claude/scripts/wiki-lint.mjs
git add -A && git commit -m "note(rename): <件数> 件のファイル名を英語にする"
node .claude/scripts/check-append-only.mjs origin/main..HEAD
git pull --rebase origin main && git push origin main
```

- `check-append-only.mjs` は、`note(rename):` のコミットが改名とリンク先のパスの書き換えだけかを確かめる。違反したら、追加のコミットで元に戻してユーザーに伝える
- 人のノートで衝突したら、止めてユーザーに伝える
- 改名した件数と、改名できなかったノートを短くユーザーに伝える。`tmp/note-rename.json` は消してよい

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 名前の案の対応表 | 人 | 3 |
| 改名の結果 | 人 | 1 |
