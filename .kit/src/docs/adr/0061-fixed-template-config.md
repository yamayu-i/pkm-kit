# ADR-0061: テンプレートの設定を上流で固定し、設定タブと子の template/config.json をなくす

- 状態: 承認
- 日付: 2026-11-08

## 背景

pkm-template には設定タブがあり、テンプレートの表示順、新規作成モーダルに出すか（`enabled`）、生成先フォルダ（`folder`）、初期ファイル名パターン（`fileNamePattern`）を変えられる（[ADR-0022](0022-template-plugin.md) §3）。変えた値は、子の `template/config.json` に上流の既定（`.kit/templates/config.json`）と違う項目だけが書かれ、読み込むときに重ねられる（[ハーネスの ADR-0009](../../../harness/docs/adr/0009-upstream-and-child-vaults.md)）。

ところが、生成先とファイル名は自由に選べるものではない。

- `daily/YYYY/MM/`、`issue/i-N`、`routine/r-N`、`member/m-N`、`sources/`、`wiki/` の置き場所は [ノート規約](../../../../.claude/docs/vault-conventions.md) が決めている。pkm-task、検査（`wiki-lint.mjs`、`.kit/bin/lint.mjs`）、スキルもこの置き場所を前提にしている
- 「今日のデイリーノートを開く」は `daily.md` の設定でパスを決める（[ADR-0023](0023-template-id-and-daily.md)）。設定を変えると、規約や pkm-ribbon とずれる
- 子ごとに表示順や生成先が違うと、同じ上流でも Vault ごとに作られるノートの置き場所と、モーダルの見え方が変わる。上流でテンプレートを直したとき、どう見えるかを確かめられない

設定を変える場面はなく、変えると規約から外れるだけになっている。

## 決定

1. テンプレートの設定（表示順、`enabled`、`folder`、`fileNamePattern`）は、上流の `.kit/templates/config.json` だけを正本にする。子は上書きしない
2. pkm-template の設定タブ（`TemplateSettingTab`）をなくす
3. 子の `template/config.json` を読まない。重ね合わせのコード（`parseTemplateOverrides`、`serializeTemplateOverrides`、`layerTemplateEntries` の上書き部分、差分を取る処理、`saveConfig`、`moveTemplateEntry`）を消す
4. テンプレートの中身（`template/file/<type>.md`）の重ね合わせは今までどおり残す。同じ名前なら子のものを使い、子だけのテンプレートも使える。上流の設定にないテンプレートは、今までの補完と同じく末尾に既定値（`enabled: true`、`folder: ""`、`fileNamePattern: ""`）で出す
5. 移行で、子の `template/config.json` を消す。上流と違う値が書かれていた場合は、捨てる値を移行の出力に挙げ、ユーザーに伝える。JSON として読めないファイルは消さずに止める（[移行の書き方](../../../harness/docs/migrations.md)）

## 理由

- 置き場所とファイル名を規約・pkm-task・検査と同じ 1 か所で決めれば、ずれが起きない
- 使われない設定の UI とコード、子のファイル 1 つ、移行 0001 の前提が要らなくなる
- 生成先などを変えたいなら、上流の既定と規約を一緒に変えるのが筋で、そのときは全 Vault に同じ形で届く

## 却下した案

- **設定タブだけ消し、`template/config.json` は手で書くファイルとして残す**: 子だけの type の生成先を決める手段は残るが、使われていない仕組みとコードが残る。規約から外れる設定を書けることも変わらない
- **今のまま残す**: 上の背景のとおり、変える理由がなく、変えると壊れる

## 影響

- 子だけの type（`template/file/<type>.md`）は、Vault ルートに作られ、ファイル名は入力したタイトルになる。置き場所を決めたい type は、上流に足す（escalate）
- [ADR-0022](0022-template-plugin.md) §3 の設定タブと `template/config.json` の部分、[ハーネスの ADR-0009](../../../harness/docs/adr/0009-upstream-and-child-vaults.md) のテンプレートの行の `config.json` の部分を置き換える。[ADR-0023](0023-template-id-and-daily.md) と [ADR-0029](0029-ribbon-plugin.md) の `template/config.json` は `.kit/templates/config.json` と読み替える
- 文書: [ノート規約](../../../../.claude/docs/vault-conventions.md)、[プラグインの設計と開発](../../../harness/docs/plugin-development.md)、`.kit/CHANGELOG.md`
- 移行 `0061-fixed-template-config` を足す。fixture の `customized/` の `template/config.json` が対象になる。移行 0001 は過去の Vault 用にそのまま残す（0001 のあとに 0061 が消す）
- `main.js` のビルドが要る。設定を書き込む処理がなくなるだけで、新しい書き込みはない
