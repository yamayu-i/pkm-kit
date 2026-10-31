# yamayu-pkm

Obsidian の Vault。同期は自作プラグイン **Vault Git**（`.obsidian/plugins/vault-git/`）で行う。コミュニティプラグインは使わない。

## Vault Git の使い方

| 操作 | 内容 |
|---|---|
| pull（リボン ↓ / コマンド） | 未コミットの変更を自動コミット → 取り込み。コンフリクトはマーカー入りのまま残して止まらない |
| push（リボン ↑ / コマンド） | リモートが先に進んでいたら何もせずモーダルを出す。そうでなければ自動コミット → push |
| 未解決のコンフリクトを一覧 | マーカー入りのノートとコンフリクト版ファイルを一覧（ステータスバーの「Git: ⚠ 未解決 N」からも開ける） |

コンフリクトの扱い:

- md / txt: `<<<<<<<` マーカー入りでコミットされる。後で PC で直せばよい
- それ以外（`.obsidian` の JSON、画像など）: リモート版を採用し、ローカル版を `名前 (conflict 端末 日時).拡張子` で残す
- 片方で削除・片方で編集: 編集した側を残す

### セットアップ（各端末で 1 回）

1. 設定 → コミュニティプラグイン → 制限モードをオフ（ストアからは何も入れない）
2. 「Vault Git」を有効にする
3. プラグイン設定で、端末名・コミットの名前・メールアドレスを入れる
4. アクセストークンを登録する（GitHub の fine-grained PAT。このリポジトリだけに限定し、権限は Contents: Read and write のみ）。トークンは Obsidian のキーチェーン（SecretStorage）に保存され、`data.json` には入らない。トークンは「トークンを送るホスト」（既定は `github.com`）の `https://` にしか送られない。PC で clone したリポジトリも origin を `https://` にしておくこと（SSH は非対応）

PC: このリポジトリを `git clone` して Vault として開く。

モバイル:

1. 空の Vault を作り、`.obsidian/plugins/vault-git/` に `main.js` と `manifest.json` を（ファイルアプリなどで）コピーする
2. 上の 1〜4 を行い、「初回 clone」にリモート URL（`https://github.com/…/….git`）とブランチを入れる
3. コマンド「リモートをこの Vault に clone（初回のみ）」を実行する

## 開発

`.plugin-src/` にソースがある。詳細は `.claude/CLAUDE.md`。

```sh
mise install
cd .plugin-src && pnpm install --frozen-lockfile && pnpm check
```
