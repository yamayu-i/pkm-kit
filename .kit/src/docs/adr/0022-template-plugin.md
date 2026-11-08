# ADR-0022: テンプレートからのノート作成を自作プラグイン vault-template として作る

- 状態: 承認（一部補足: 0023）
- 日付: 2026-11-01

## 背景

[ADR-0007](../../../harness/docs/adr/0007-note-format.md) と [ノート規約](../../../../.claude/docs/vault-conventions.md) で、ノートの `type` ごとに `template/file/<type>.md` を置く構成を採用した。
現状のテンプレートには `"{{date:YYYY-MM-DDTHH:mm:ssZ}}"` や `"{{title}}"` などのプレースホルダが書かれているが、Obsidian 標準の Templates コアプラグインは無効化されており、Templater 等のコミュニティプラグインも使わない方針である。

ホットキー（`Cmd + N` など）からモーダルを開き、`template/file/` のテンプレートを選んで生成先フォルダ・ファイル名・変数の値を柔軟に解決してノートを作成できる自作プラグインが必要になった。

## 決定

### 1. プラグインの構成

- 新しい自作プラグイン `vault-template` を `.kit/src/packages/vault-template/` に作り、ビルド成果物（`main.js` / `manifest.json` / `styles.css`）を `.obsidian/plugins/vault-template/` に出力する
- `vault-git`・`vault-task` と同様、Obsidian に依存しない `src/core/`（テンプレート構文解析、変数・日時展開、設定の読み書き、出力先パスの解決）と、Obsidian に依存する `src/obsidian/`（モーダル、設定タブ、ファイル生成、カーソル移動）に分離する
- UI は Preact と `packages/design` のデザイントークン（`tokens.css` + `styles.css`）で組み、[デザインルール](../design.md) と検査（`PLUGIN_CSS`、`security-scan.mjs`）の対象に含める
- 新規の外部パッケージは追加しない（既存の `preact` のみを使う）

### 2. テンプレート記法と変数展開

`template/file/*.md` 内の `{{...}}` 記法を解析・展開する（既存の `template/file/*.md` と完全互換）。

| 記法 | 展開される値 |
|---|---|
| `{{date}}` / `{{date:<FORMAT>}}` | 作成時のローカル日時。`<FORMAT>` 省略時は `YYYY-MM-DD`。トークンは `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `ddd`（`sun`〜`sat`）, `HH`, `H`, `mm`, `m`, `ss`, `s`, `Z`（`+09:00` 形式のオフセット）および `[...]` のリテラル保護に対応 |
| `{{time}}` / `{{time:<FORMAT>}}` | `{{date:<FORMAT>}}` と同じ日時フォーマッタ。`<FORMAT>` 省略時は `HH:mm` |
| `{{title}}` | モーダルで入力したタイトル（未入力時はファイル名から `.md` を除いた basename） |
| `{{path}}` / `{{folder}}` | 生成されるファイルの Vault ルートからのパス（例: `wiki/foo.md`）と親フォルダ（例: `wiki`、ルートなら空文字） |
| `{{prompt:<ラベル>}}` / `{{prompt:<ラベル>:<既定値>}}` | モーダル内に `<ラベル>` の追加入力欄を動的に出し、入力値を挿入する（同じラベルが複数あれば 1 回の入力で全て置換） |
| `{{cursor}}` | 作成後にファイルを開いたときの初期カーソル位置。本文からは除去し、最初の `{{cursor}}` の位置にカーソルを置く |

### 3. 設定の保存形式（`template/config.json`）

- `.obsidian/plugins/*/data.json` は端末固有設定・秘密情報保護のため git 管理外（`security-scan.mjs` で追跡禁止）としているため、端末間で共有するテンプレート設定は Vault 内の `template/config.json` に保存する（`vault-task` の `issue/labels.json` や `issue/board-groups.json` と同じ方式）
- 各テンプレートの設定項目:
  - `file`: `template/file/` 直下のファイル名（例: `"note.md"`, `"daily.md"`）
  - `enabled`: 新規作成モーダルの一覧に出すか（`boolean`。`issue.md` / `routine.md` / `member.md` のように `vault-task` が専用で生成するものや、`index.md` / `log.md` のような単一ファイルを非表示にできる）
  - `folder`: 生成先フォルダ（Vault ルートからのパス。`"daily/{{date:YYYY}}/{{date:MM}}"` のように日時変数の展開も可）
  - `fileNamePattern`: ファイル名（`.md` を除く）の初期値パターン（例: `""` なら入力したタイトルをそのままファイル名にし、`"{{date:YYYY-MM-DD}}"` なら日付を初期値にする）
- 配列の並び順をモーダルでの表示順とする。`template/file/` に未設定の `.md` ファイルがある場合は、末尾に既定値（`enabled: true`, `folder: ""`, `fileNamePattern: ""`）で補完して扱う
- プラグインの設定タブ（`PluginSettingTab`）で、表示順の並び替え・表示/非表示・生成先フォルダ・ファイル名パターンを編集できるようにする

### 4. 新規ファイル作成モーダル

- コマンド「テンプレートから新規ファイルを作成」とリボンアイコンを用意する（`Cmd + N` などのホットキーは Obsidian の設定で割り当てる）
- 1 つのモーダル内で「テンプレート選択」「ファイル名（タイトル）入力」「テンプレート内の `{{prompt:...}}` 入力欄」「生成先パスのプレビュー」を同時に表示する
- テンプレートを切り替えると、生成先フォルダ・ファイル名初期値・`{{prompt:...}}` の入力欄が即座に切り替わる
- 同じパスのファイルが既に存在する場合はモーダル上にエラーを表示し、上書きしない
- 作成時は親フォルダがなければ自動作成し、生成したファイルをエディタで開いて `{{cursor}}` の位置（指定がなければ末尾）にフォーカスする

## 理由

- 既存の `template/file/*.md` の書式（`"{{date:YYYY-MM-DDTHH:mm:ssZ}}"`, `"{{title}}"`）をそのまま活かせる
- `{{prompt:...}}` と `folder` / `fileNamePattern` の変数展開により、JavaScript コード片をテンプレートに埋め込まなくても、自由度の高い値挿入と配置（`daily/YYYY/MM/YYYY-MM-DD.md` や `sources/`、`wiki/` など）に対応できる
- 設定を `template/config.json` に置くことで、`data.json` の git 追跡禁止ルールを守りつつ PC とモバイルで同じテンプレート順序・生成先を共有できる

## 却下した案

- **Templater のように任意の JavaScript 式（`<% ... %>`）を `eval` / `new Function` で実行する**: `security-scan.mjs` が禁止している危険な API であり、Vault 内のノート同期を通じて任意コード実行のリスクが生じるため却下
- **ステップ式のモーダル（先にテンプレートを選び、次のモーダルでタイトル等を入力する）**: よく使うテンプレート（一番上に置いた `note` など）で素早くノートを作るときに操作回数が増えるため、1 画面で完結するモーダルにした
- **設定を `.obsidian/plugins/vault-template/data.json` に保存してコミットする**: `security-scan.mjs` の「プラグインの data.json が追跡されていない」検査と衝突し、端末設定と Vault 共有設定の境界が曖昧になるため却下

## 影響

- ファイルの書き込みを伴う新しいプラグインなので、実装後にセキュリティチェックの対象になる
- `.obsidian/community-plugins.json` に `"vault-template"` を追加し、`.obsidian/plugins/vault-template/` にビルド成果物をコミットする
- [プラグインの設計と開発](../../../harness/docs/plugin-development.md) と [ノート規約](../../../../.claude/docs/vault-conventions.md) に `vault-template` の説明を追加する
