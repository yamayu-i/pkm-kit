# セキュリティチェック 2026-11-09（図の 3 方式と pkm-diagram への改名）

- 対象 commit: da601b6
- 前回: 2026-11-08（5041633）
- 結果: pass

プラグイン pkm-drawio を pkm-diagram に改名し（ビルド設定 `esbuild.config.mjs`・lockfile の importer の名前・`security-scan.mjs` の対象が変わった）、CLI に外部のコマンド（d2）を呼ぶ処理と SVG の検査を足したので行った（ADR-0102）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass。pkm-diagram を再現性と require の検査の対象にし、`bins` に `diagram.mjs` と旧名の `drawio.mjs` を入れた（`allowedRequires` は `obsidian` だけ）
- `pnpm check`: 型チェックとビルドは成功。テストは、このクラウドの環境では並列の実行がメモリ不足で止まる（SIGKILL と vitest のキャッシュの衝突）ので、`pnpm -r --workspace-concurrency=1 test` で全パッケージを実行して成功。`node .claude/scripts/verify.mjs`: すべて成功
- `pnpm --filter pkm-diagram preview:ui`: 問題なし
- `pnpm outdated`: 出力なし

## 目視レビュー

- **認証情報・通信**: 触れていない。CLI の `d2` はネットワークを使わない（d2 はローカルで描く）: 問題なし
- **外部のコマンドの実行（CLI だけ。プラグインには入らない）**: `spawnSync(bin, [引数の配列])` でシェルを通さない。`bin` は `--d2`・環境変数 `D2_BIN`・`d2` の順で、ユーザーが自分の端末で決めるもの。入力の `.d2` は一時フォルダ（`os.tmpdir()` の `mkdtemp`）に書いて渡し、終わったら消す: 問題なし
- **ファイル書き込み**: `svg-style` / `d2` は、検査（`checkPlainSvg`）を通ったものだけを、指定されたパス（既定は入力と同じ場所）に書く。誤りがあれば書かない。移行 0102 は子の `.obsidian/community-plugins.json`・`hotkeys.json`・`template/snippet/*.md` の frontmatter の `command` の行と、この端末の旧 ID の `data.json` だけを扱い、読めない JSON は変えずに check で止める: 問題なし
- **SVG の安全性**: `checkPlainSvg` は既存の `findSvgProblems` に加えて、外部の読み込み（警告だったもの）と `foreignObject` を誤りにする。AI が書く SVG は、色の値と独自の `<style>` も誤りにする（スタイルは CLI が差し込む決まったものだけ）。`export` が埋め込む対象を `.drawio.svg` から `asset/` などの `.svg` 全般に広げたが、埋め込む前の `findSvgProblems` の検査は同じ: 問題なし
- **データ消失**: 移行 0102 は、新旧の両方があれば新しい方を残す。古いフォルダは `data.json` だけが残り中身が同じときだけ消す: 問題なし
- **UI**: プラグインの UI は変えていない（改名と、書き出しの対象の判定だけ）: 問題なし
- **サプライチェーン**: lockfile の差分は importer の名前（`packages/pkm-drawio` → `packages/pkm-diagram`）だけで、新しいパッケージはない。d2 はリポジトリの依存にせず、使う人の環境に入れる。`allowBuilds`・`minimumReleaseAge` は変わらない。バンドル: pkm-diagram 61,142 バイト（改名前の pkm-drawio は 60,957 バイト。書き出しの対象の判定を足した分）

## 依存

- 追加なし

## 対応したこと / 残課題

- 残課題: 実機で、改名後のプラグインが有効になっていること（移行 0102）、Mermaid の図の配色、`asset/` の SVG の図のダークの色が Obsidian のテーマ設定に従うかを確かめる
