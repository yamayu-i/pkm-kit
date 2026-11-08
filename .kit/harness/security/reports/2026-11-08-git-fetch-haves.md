# セキュリティチェック 2026-11-08

- 対象 commit: be48d5c（未コミットの差分: Issue #87 の pkm-git の fetch と転送量の計測）
- 前回: 2026-11-08 5041633
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストが成功（pkm-git 97 テスト）

## 目視レビュー

対象は `src/git/engine.ts`（fetch に渡す ref、転送量を数える HTTP クライアントの包み）と `src/main.ts`（コンソールへの出力）。

### 認証情報
- 問題なし。トークンの取り出し（`getAuth`）と `onAuth` の検査は変えていない。新しい出力は固定の工程名と数値だけで、URL・ヘッダー・本文・認証情報を含まない

### 通信
- 問題なし。数える包み（`countingHttp`）は、`createHttpClient`（送信直前の `assertAuthTarget` を含む）の外側に重ねるだけで、リクエストの宛先・ヘッダー・本文を変えない。body のチャンクの長さを足して、そのまま渡す
- fetch の接続先は今までどおり設定の remote。`ref` を追跡ブランチにしても、`remote` は明示して渡しているので `.git/config` の別の remote に切り替わらない。`corsProxy` は使っていない

### ファイル書き込み
- 問題なし。作業ツリーへの書き込みの経路（`moveTo`、`assertSafeWorktreePath`、`WorktreeChangedError`）は変えていない。fetch が書くのは追跡ブランチと objects だけ（今までと同じ）

### データ消失
- 問題なし。マージの分岐は変えていない。have が変わるのはサーバーが送る pack の範囲だけで、足りないオブジェクトはサーバーが送る（テスト F1・F2 で両方の変更が残ることを確認）

### UI
- 変更なし

### サプライチェーン
- 依存・lockfile・`pnpm-workspace.yaml` の変更なし
- バンドル: 691,019 → 693,394 バイト（転送量の計測の分）

## 依存

変更なし。

## 対応したこと / 残課題

- なし
