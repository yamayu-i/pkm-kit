# ADR-0008: updated は作成時にも入れる

- 状態: 承認
- 日付: 2026-11-01
- 置換: [ADR-0007](0007-note-format.md) の updated の付与方針（付与の経路の部分だけ）

## 背景

[ADR-0007](0007-note-format.md) は「updated は人や AI に記入させず、PC・Mobile のコミット時に変更ノートへ自動付与する」とした。自動付与（[Issue #9](https://github.com/yamayu-i/yamayu-pkm/issues/9)）は未実装で、その間は空欄を許していた。

その結果、テンプレートから作ったノートも、vault-task が作るノートも、作成直後は updated が空になる。作成時に created と updated の両方が入ってほしい。

また issue / routine / member は、vault-task でも vault-template でも作れる、Vault の通常のノートである。どちらで作っても同じ項目が揃う必要がある。

## 決定

- updated は、**作成時にも**入れる。作成時の値は created と同じにする
- コミット時の自動付与（Issue #9）は変えない。後から変更したときの更新を担う
- 対象は `template/file/` のすべてのテンプレートと、vault-task が作るファイル（issue / routine / member / daily）
- 作成の経路は 1 つに限らない。vault-template（テンプレート）でも、vault-task（コード）でも作れる。issue / routine / member のテンプレートは、vault-task が正常に動くのに必要な項目（schema、id、summary など）をすべて持つ
- ノートを作る仕組みを足すときは、作成時に created と updated の両方を入れる

updated は内容の正確さや最新性を示さない（ADR-0007 のまま）。

## 理由

- 作成直後のノートに updated がないと、検索・並び替え・検査で例外扱いが要る
- 作成時に入れるのはプラグインとコードであり、人や AI が手で書くわけではない。ADR-0007 の「人や AI に記入させない」とは両立する
- コミット時の付与は、作成後の変更を拾うために残す

## 却下した案

- **コミット時の付与だけにする（現状）**: 実装まで空欄が残り、vault-task が作るノートにも updated がない
- **issue / routine / member のテンプレートを置かず、vault-task だけで作る**: vault-task を使えない場面（モバイルのモーダルなど）や、vault-template のモーダルから作りたい場合に対応できない

## 影響

- [ノート規約](../../../../.claude/docs/vault-conventions.md)の共通 frontmatter を直す
- テンプレート 13 個の `updated:` を `"{{date:YYYY-MM-DDTHH:mm:ssZ}}"` にする
- vault-task の新規作成（issue / routine / member / daily）に updated を足す。既存のファイルの補完は範囲外
- ID の連番のテンプレート記法は [ADR-0023（プラグイン）](../../../src/docs/adr/0023-template-id-and-daily.md)
