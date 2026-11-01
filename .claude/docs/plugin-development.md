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

### 処理時間の計測

工程名と経過時間をコンソールに出す。計測範囲・検証・今後の高速化候補は [計測とツリー再利用](../../.plugin-src/packages/vault-git/PERFORMANCE-HANDOFF.md) を参照。

## vault-task（タスク管理）

設計判断は ADR に残している: `.plugin-src/docs/adr/README.md`（ハーネスと wiki の ADR は [別の場所](adr/README.md)）。実装するときは承認済みの ADR に従い、決定を変えるときは新しい ADR を作る。
ADR-0001 の段階 1〜5 はすべて実装済み（スキーマ・索引・lint、issue 画面・一括登録、DailyTaskView・タイマー、dead / caution の整理、グループ管理・各 View）。

### コードの構成（`.plugin-src/packages/vault-task`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/` | スキーマ、repeat、按分、索引、lint、ファイルの中身の生成 | なし |
| `src/obsidian/` | 索引の保持（metadataCache から）、Vault への書き込み、モーダル、一括登録 | あり |
| `src/header/` | issue 画面のヘッダー（CodeMirror の block widget + preact） | あり |
| `src/views/` | 各 View（Daily と Board、Issues、Inbox、Organize、Scheduled、Someday、Routines、Board groups） | あり |
| `src/ui/` | preact の部品（バッジ、一覧の行、操作バー、フォーム、カレンダー、ページング） | 一部 |
| `preview/` | UI のプレビュー（`pnpm preview:ui`）。モックとデータ。プラグインには同梱しない | なし |
| `cli/` | `pnpm task:lint` と `pnpm task:worklog-review`（worklog-review スキル用）の CLI。Node の API と `yaml` を使うので `src/` の外に置き、プラグインには同梱しない | なし |

### 注意点

- frontmatter の更新は `fileManager.processFrontMatter` で行う（ほかの欄や書式を壊さない）。値が空なら欄ごと消す
- ボードを締めるときは例外として `vault.process` で `closed` と本文の要約を一度に保存する。`closeBoardNote` が未完了を再検査し、YAML の `board` ブロックだけを置換する。安全に位置を特定できない YAML や、他の欄の値が変わる場合は保存しない
- `children` / `actual_effort` / `updated` は保存しない（ADR-0002）。索引で計算する
- データの置き場所: issue / routine / member の md、`worklog/<端末名>/YYYY-MM.jsonl`、`issue/labels.json`、`issue/board-groups.json`、デイリーノートの frontmatter の `board`（ADR-0014）
- 端末ごとの設定（端末名・Issue List の保存した条件）は `.obsidian/plugins/vault-task/data.json`。git に入れない
- 間違っていそうな worklog は [worklog-review スキル](../skills/worklog-review/SKILL.md) でユーザーと一緒に直す（止め忘れの警告や自動停止はしない。ADR-0009）
- worklog の編集・削除は `vault.process` で 1 行だけ書き換える（`replaceWorklogLine`）。行の ID が合わなければ書かない。開始日時を別の月に変えても、ファイルは移さない
- CodeMirror（`@codemirror/*`）は Obsidian 本体のものを使うので external にする。security-scan もそれだけを許可している
- **UI はデザインルール `.plugin-src/docs/design.md` に従う**（ADR-0016）。値は `packages/design/tokens.json` にだけ書き、`styles.css` ではトークン（`--vt-*`）だけを使う。新しい色や部品を足したら、トークンと design.md も更新する
- `styles.css` はビルドで `tokens.css`（生成物）の後ろに連結して出力する
- UI は Obsidian なしで確認できる: `pnpm preview:ui`（`packages/vault-task/preview/`）。`obsidian` をモックに差し替えて束ね、Vault のスニペットを読み込み、Chromium でライト / ダーク × 広い / 狭いペインのスクリーンショットを撮る。続けて描画した画面を検査する（コントラスト・押せる大きさ・フォーカス・キーボード）。UI を変えたら、通して見てからコミットする

## design（デザイントークンと検査）

`.plugin-src/packages/design`。プラグインではなく、デザインの値の正本と検査を置く（ADR-0016）。

| パス | 役割 |
|---|---|
| `tokens.json` | 値の正本（Design Tokens Format Module 2025.10） |
| `src/tokens.ts` | 読み込みと書式の検査 |
| `src/color.ts` / `src/contrast.ts` | WCAG のコントラスト比と、トークンに書いた条件の検査 |
| `src/emit.ts` / `scripts/generate.ts` | 生成（`pnpm build` に含まれる） |
| `node/` | ファイルの読み書きとパス。Node の API を使うので `src/` の外に置く（security-scan は `src/` で Node の API を禁止している） |
| `src/css-lint.ts` / `src/obsidian-config.ts` / `src/doc-lint.ts` | CSS・Obsidian の設定・design.md の検査（`pnpm check` の test で走る） |
| `src/audit.ts` | 描画した画面の検査（`pnpm preview:ui` から使う） |
| `generated/tokens.ts` | TS から使う色（vault-task の label の検査）。生成物 |

- vault-task は `src/color.ts` と `generated/tokens.ts` を相対パスで読み、プラグインに束ねている（`src/` は Obsidian にも Node にも依存しない）
- スクリプトは Node の型の除去で `.ts` をそのまま動かす（ビルドしない）

## 進め方

- 工程は [進め方](workflow.md) に従う（計画 → テストを先に書いて実装 → PR）
- 変更したら `pnpm check`（型チェック・ビルド・テスト）を通してからコミットする。`node .claude/scripts/verify.mjs --plugin` でハーネスの検査とまとめて実行できる
- 新しいマージのケースを扱うときは、先に `test/engine.test.ts` か `test/tree-merge.test.ts` にテストを足す
- 新しいプラグインを作るときは `.plugin-src/packages/<id>/` に置き、ビルド結果を `.obsidian/plugins/<id>/` に出す
