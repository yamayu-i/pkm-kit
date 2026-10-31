# 自作プラグインの設計と開発

## vault-git（git 同期）

コミュニティプラグインの Obsidian Git を使わずに、pull / push だけを自作したもの。モバイル（iOS / Android）でも動く。

### 方針（jj の考え方を取り入れている）

- **作業中の変更も常にコミット**: pull / push の最初に未コミットの変更を自動でコミット（snapshot）する
- **コンフリクトで止まらない・消さない**: コンフリクトしたらマーカー入りのままマージコミットし、そのまま push できる。解決は後で PC で行う
- **リモートを優先するのは、マーカーを入れられないファイルだけ**: JSON・バイナリなどはリモート版を採用し、ローカル版を `name (conflict <端末> <日時>).ext` として残す

### pull

1. snapshot → fetch
2. 最新 / ローカルが先行 → 何もしない
3. ローカルが遅れているだけ → fast-forward
4. 分岐 → ファイル単位の 3-way マージ（`src/merge/tree-merge.ts`）
   - 片側だけの変更 → 採用
   - 両側の変更 → 行単位でマージ。重なったら md / txt はマーカー、それ以外はリモート優先＋ローカル版を別名保存
   - 削除 vs 編集 → 編集側を残す
   - マージコミットのメッセージに `Conflicts:` として一覧を残す
5. 作業ツリーへの反映は「書く → インデックス更新 → 最後にブランチを進める」の順。snapshot の後に編集されたファイルがあれば中断する

### push

1. fetch → リモートが先に進んでいたら（behind）モーダルを出して中断（コミットもしない）
2. snapshot → push。fetch と push の間に他の端末が push して拒否された場合も同じモーダル

### コードの構成（`.plugin-src/packages/vault-git/src`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `git/engine.ts` | pull / push / snapshot / clone | なし |
| `merge/` | ツリーと行のマージ、パスの安全性検査 | なし |
| `fs/` | isomorphic-git 用の fs アダプタ | なし |
| `git/http.ts` | `requestUrl` を isomorphic-git の HTTP クライアントにする | なし（関数を注入） |
| `obsidian/` | Vault への読み書き、設定画面、モーダル | あり |
| `main.ts` | コマンド・リボン・ステータスバー | あり |

Obsidian に依存しない部分は、テストで本物の `git http-backend` サーバーを立てて検証している（`test/engine.test.ts`）。
`test/bundle.test.ts` はビルド済みの `main.js` を Obsidian API のモック上で、Buffer がない状態（モバイル相当）で動かす。

### 注意点

- isomorphic-git はファイルの更新時刻を秒単位でしか比べないので、snapshot で racy な候補だけハッシュを比べ直している
- 通常のノートは Vault API 経由で書く（開いているエディタとキャッシュに反映させるため）。`.git` / `.obsidian` などの隠しパスはアダプタで直接書く
- トークンは SecretStorage に置き、`data.json` には ID しか保存しない。エラーメッセージは `redactSecrets` で伏せる
- トークンは設定の「トークンを送るホスト」の `https://` にだけ送る（`src/git/auth-target.ts`）。onAuth と、HTTP 送信直前（Authorization ヘッダー付きのとき）の二段で検査する。http はループバックのみ例外

## vault-task（タスク管理、設計中）

設計判断は ADR に残している: `.plugin-src/docs/adr/README.md`。実装するときは承認済みの ADR に従い、決定を変えるときは新しい ADR を作る。

## 進め方

- 変更したら `pnpm check`（型チェック・ビルド・テスト）を通してからコミットする
- 新しいマージのケースを扱うときは、先に `test/engine.test.ts` か `test/tree-merge.test.ts` にテストを足す
- 新しいプラグインを作るときは `.plugin-src/packages/<id>/` に置き、ビルド結果を `.obsidian/plugins/<id>/` に出す
