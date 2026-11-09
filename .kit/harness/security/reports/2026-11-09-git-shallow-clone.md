# セキュリティチェック 2026-11-09

- 対象 commit: be03b7d（Issue #106、ADR-0106。PKM Git の shallow clone）
- 前回: 2026-11-09 64627e8（Issue #103、衝突の記録）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed
- `pnpm check`: 成功（pkm-git 153 テスト、全パッケージ成功）

## 目視レビュー

対象: `src/git/engine.ts` の `clone()`（`depth: 1` を足しただけ）。

### 認証情報・通信
- 問題なし。接続先・認証の渡し方・`assertAuthTarget` の経路は変わらない。取得するものが減るだけ

### ファイル書き込み
- 問題なし。展開の前にツリーのパスを `assertSafeWorktreePath` で検査する手順は変わらない。新しく書かれるのは isomorphic-git が書く `.git/shallow` だけ（`.git` の中）

### データ消失
- 問題なし。手元にない共通祖先は「なし」として扱われ、空の祖先でマージして両側を残す（ADR-0103 の 4）。テストで、履歴を書き換えたリモートとマージしても、手元の版とリモートの版の両方が残ることを確かめた

### サプライチェーン
- 依存・lockfile の変更なし
