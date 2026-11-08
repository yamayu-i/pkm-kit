# テンプレート

## 目的

ノートの初めの形（frontmatter と見出し）と置き場所を決めておき、作るときに考えずに済ませる。

## 状態

上流の既定 `.kit/templates/` に、Vault の `template/` を重ねる。`config.json` に、モーダルに出すか・置き場所・ファイル名のパターン。`{{title}}`、`{{date}}`、`{{prompt:…}}`、`{{prompt-date}}`（日付をダイアログで尋ねる）、`{{id:i}}` などの変数。

## 操作

テンプレートから新規ファイルを作成するモーダルで、テンプレートを選び、タイトルと追加の入力を入れる。書いている途中のノートには、行頭の `/` でスニペット（`template/snippet/`）を、行頭か空白の後の `@` でインラインテンプレート（`template/inline/`。例: `@date` で日付）を入れる。

## 使い方の筋道

テンプレートを選ぶと、置き場所とファイル名が決まる。issue などの ID は自動で次の番号になる。同じパスにノートがあれば作らない。

## 根拠

[ADR-0022](../../../../src/docs/adr/0022-template-plugin.md)、[ADR-0023](../../../../src/docs/adr/0023-template-id-and-daily.md)、[ハーネスの ADR-0009](../../adr/0009-upstream-and-child-vaults.md)
