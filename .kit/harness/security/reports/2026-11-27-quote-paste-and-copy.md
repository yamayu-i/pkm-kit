# セキュリティチェック 2026-11-27

- 対象 commit: d2f1ca6
- 前回: 2026-11-27 0200d78（2026-11-27-sub-bulk-and-period.md）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現性、require、pnpm audit）
- `node .claude/scripts/verify.mjs --plugin`（`pnpm check` を含む）: すべて通過

## 目視レビュー

対象は ADR-0251（pkm-markdown の引用への貼り付けと、引用・コールアウトのコピーボタン）。`src/obsidian/` を変えたので実施した。

### 認証情報
- 問題なし。認証情報・SecretStorage に触れない

### 通信
- 問題なし。`requestUrl`・`fetch`・外部 URL の追加はない

### ファイル書き込み
- 問題なし。ファイルには書かない。貼り付けはエディタの `replaceSelection` だけで、本体の貼り付けと同じ経路でノートに入る
- 貼り付けのイベントで渡されたクリップボードの中身（`text/plain`・`text/html`）を読むが、エディタに入れる以外に使わず、保持もしない。HTML は Obsidian の `htmlToMarkdown` で Markdown の文字にしてから入れる（DOM には入れない）

### データ消失
- 問題なし。処理するのは引用の中・複数行・カーソル 1 つのときだけで、それ以外は本体に任せる。取り消し（Ctrl+Z）は本体の貼り付けと同じ 1 回の変更

### UI
- 問題なし。HTML 文字列を DOM に入れていない。ボタンは既存の `createCopyButton`（`createElement` と `setIcon`）。コピーはクリップボードへの書き込みだけ

### サプライチェーン
- 依存・lockfile・`pnpm-workspace.yaml` の差分はない
- pkm-markdown の main.js は 8,279 → 14,064 バイト。貼り付けの処理、引用の判定、ライブプレビューの引用・コールアウトの対応の追加で説明できる

## 依存

- `pnpm outdated`: 更新のある依存なし
- lockfile の差分なし

## 対応したこと / 残課題

- 残課題: なし
