# ノートの type

## 目的

ノートの役割（話題や進み具合ではない）を 1 つの値で表し、テンプレート・一覧・ヘッダーの出し方を決める。

## 状態

frontmatter の `type`。今の type: note、daily、source、concept、entity、topic、answer、issue、routine、member、index、log、feedback。共通の項目は `created`、`updated`（作成とコミットのときに自動で入る）。

## 操作

テンプレートを選ぶと決まる。手では変えない。

## 使い方の筋道

type ごとにヘッダーが出て、主な項目を見せる（issue と routine は pkm-task、それ以外は pkm-template）。一覧 View は場所ではなく type で集める。

## 根拠

[ハーネスの ADR-0007](../../adr/0007-note-format.md)、[ADR-0026](../../../../src/docs/adr/0026-note-views.md)、[ADR-0027](../../../../src/docs/adr/0027-hide-properties-english-labels.md)
