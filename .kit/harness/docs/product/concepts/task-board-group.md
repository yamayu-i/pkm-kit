# ボードのグループ

## 目的

ボードを時間帯や種類で区切り、どのカードをいつやるかを並びで表す。

## 状態

`issue/board-groups.json`（全端末で共有。2 階層まで）。routine の `group` は、一度も移していないときの置き場所。カードを移した場所は操作ログに残る。

## 操作

Board groups で作る・名前を変える・並べる。ボードでカードを移す。

## 使い方の筋道

カードを移すと、次の日からも前に置いたグループに出る。グループの名前を変えると、過去のボードのカードは未分類に出る。

## 根拠

[ADR-0014](../../../../src/docs/adr/0014-daily-board.md)、[ADR-0015](../../../../src/docs/adr/0015-board-layout-simplified.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)
