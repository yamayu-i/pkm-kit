# セキュリティチェック 2026-11-08（プラグインの改名 pkm-*）

- 対象 commit: 5933a32
- 前回: 2026-11-08（5041633）
- 結果: pass

プラグインのフォルダ・ID・ビルド設定（esbuild の出力先と環境変数）を変え、pkm-git と pkm-task の設定の読み込みに、旧 ID の data.json を引き継ぐ処理を足したので行った（ADR-0058）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass（ビルド再現性は新しい `PKM_*_OUTDIR` と `pkm-*` のフォルダで確かめた）
- `pnpm check`: 成功（pkm-git 85、pkm-task 285、pkm-template 112、pkm-html 13、pkm-ribbon 3、design 67、shared 17 件）。`node .claude/scripts/verify.mjs --plugin`: すべて成功

## 目視レビュー

- **認証情報**: トークンは SecretStorage のまま。`data.json` が持つのは SecretStorage の ID だけで、引き継ぎはそれを写すだけ（トークンの値は読まない・ログに出さない）: 問題なし
- **ファイル書き込み**: 引き継ぎは `app.vault.adapter` で `<configDir>/plugins/vault-<名前>/data.json` を読み、Obsidian の `saveData` で自分の data.json に保存するだけ。パスは固定の ID から作り、外からの入力を使わない。古いファイルは消さない。読めない・オブジェクトでない JSON は使わない: 問題なし
- **data.json の追跡**: `.gitignore` に旧名の `data.json` の行も残した。移行が届かない端末に古い data.json が残っても、同期のコミットに入らない。`security-scan` の「data.json が追跡されていない」は `*` で全プラグインを見るので、名前に依存しない: 問題なし
- **移行 0058**: 子の `.obsidian/` の 3 つの JSON を書き換え、`.obsidian/plugins/vault-*/` の data.json を写す。古いフォルダを消すのは、data.json だけが残り新しい方と同じ中身のときだけ: 問題なし
- **通信・UI**: 変更なし（名前の置き換えだけ）
- **サプライチェーン**: 依存の追加なし。lockfile はワークスペースのパスの改名だけ。`allowBuilds`・`minimumReleaseAge` は変わらない。バンドルサイズは pkm-git が 690,025 → 690,978、pkm-task が 291,257 → 292,144 バイト（引き継ぎの処理の分）

## 依存

- `pnpm outdated`: 更新なし。lockfile で増えたパッケージはない

## 対応したこと / 残課題

- 対応: `.gitignore` に旧名の data.json を残した（上の「data.json の追跡」）
- 残課題: Obsidian 上での確認（開き直して端末名と pkm-git の設定が引き継がれる）は手動。モバイルでも確かめる
