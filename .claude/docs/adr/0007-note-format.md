# ADR-0007: PKMの共通書式とDailyNote本文の保護

- 状態: 承認
- 日付: 2026-10-31
- 置換: [ADR-0004](0004-human-notes-append-only.md)

## 背景

ユーザーとの議論で、共通メタデータとtype別テンプレートを採用した。保護対象は「人が書いたもの全般」から「DailyNoteの既存本文」に限定する。

## 決定

[ノート規約](../vault-conventions.md)の共通frontmatterを採用する。type、created、updatedを共通項目とし、typeごとに template/file/ 直下へテンプレートを置く。

DailyNoteの既存本文は許可なく変更・削除しない。追記を許す。frontmatterは保護対象外。新規DailyNoteの作成を妨げない。ファイル削除・移動による保護の回避は許さない。許可された本文修正は通常のdocsコミットで記録する。その他のノートは依頼の範囲で編集できる。元資料の不変性と、タスクデータを専用処理で管理する規約は維持する。

updatedは人やAIに記入させず、PC・Mobileのコミット時に変更ノートへ自動付与する。[Issue #9](https://github.com/yamayu-i/yamayu-pkm/issues/9)で実装を管理する。取得日時・知識の確認日時とは区別する。

## 理由

最小の共通項目で検索・分類・検査を揃える。type別テンプレートを追加の条件にして種類の無秩序な増加を抑える。日時の書き込みはコミット経路に集め、編集イベントごとの再書き込みを避ける。

## 移行と実装状態

このPRは規約とテンプレートの決定を記録する。updated自動付与は実装しない。未実装期間はupdatedの空欄を許す。既存ファイルの一括移行も行わない。

既存のcheck-append-onlyは旧区分・行差分ベース、wiki-lintは日付のみを想定している。新規約への適合検査、DailyNote本文だけの比較、テンプレートと生成コードの適合、既存ノートの移行は実装が必要。これらが完了するまで検査を迂回せず、新規約に基づく編集はPRで確認する。規約の採用と実装完了を区別する。

## 参考

- [Obsidian Properties](https://help.obsidian.md/properties)
- [Obsidian Templates](https://help.obsidian.md/plugins/templates)
- [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
