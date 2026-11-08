---
name: security-check
description: 上流 pkm-kit の自作 Obsidian プラグイン（.kit/src / .obsidian/plugins）と、子の Vault で動く CLI・セットアップ（.kit/bin / .kit/setup.mjs）のセキュリティチェックを実施し、レポートと実施記録を残す。週 1 回の定期チェック、SessionStart フックが期限切れと出したとき、依存・認証・通信・ファイル書き込み・ビルド設定を変えたとき、ユーザーがセキュリティチェックを頼んだときに使う。
---

# 自作プラグインのセキュリティチェック

実施ルールと頻度は [実施ルール](../../docs/security-check-schedule.md) を参照。上流（`.kit-local/` がない）で行う。ここでは手順を定める。
すべて終わるまで `last-check.json` を更新しないこと。

## 1. 前回からの差分を把握する

```sh
cat .kit/harness/security/last-check.json        # 前回の commit を確認（ない場合は初回）
git log --oneline <前回の commit>..HEAD -- .kit/src .kit/bin .kit/setup.mjs .kit/lib .obsidian/plugins
git diff <前回の commit>..HEAD --stat -- .kit/src .kit/bin .kit/setup.mjs .kit/lib .obsidian/plugins
```

初回は全体を対象にする。

## 2. 機械的なチェック

```sh
cd .kit/src
pnpm install --frozen-lockfile
pnpm security:scan      # 秘密情報・危険な API・依存の固定・lockfile・ビルド再現性・require・pnpm audit
pnpm check              # 型チェック・ビルド・テスト
pnpm outdated           # 更新のある依存（すぐ上げる必要はない。脆弱性修正なら上げる）
```

ネットワークがなく `pnpm audit` が失敗したら `pnpm security:scan --offline` で残りを確認し、レポートに「audit 未実施」と書く（この場合の結果は `pass` にしない。`partial` とする）。

## 3. 目視レビュー（差分を中心に、初回は全体）

各項目について「問題なし／要対応（理由）」を判断する。

### 認証情報
- [ ] トークンは `app.secretStorage` からその都度取り出しており、`data.json`・メモリ上の長期保持・ログ・Notice・コミットメッセージ・URL に入っていない
- [ ] すべてのエラー表示とログが `redactSecrets` を通っている
- [ ] clone URL に認証情報を埋め込めないようになっている

- [ ] `security-scan: allow` が付いた行（スキャンの除外）が、本当にダミー値だけか

### 通信
- [ ] 通信は `requestUrl` → `createHttpClient` の経路だけ。`corsProxy` など第三者のサーバーを経由していない
- [ ] 接続先はユーザーが設定した remote だけ（ハードコードされた外部 URL がない）
- [ ] 認証情報は `checkAuthTarget`（https かつ「トークンを送るホスト」と一致）を通った接続先にしか送られない。onAuth と HTTP 送信直前の両方で検査している

### ファイル書き込み
- [ ] 作業ツリーへの書き込み・削除は `assertSafeWorktreePath` を通ったパスだけ（`..`、絶対パス、`.git` を拒否）
- [ ] Vault の外に書く経路がない
- [ ] snapshot の後に編集されたファイルを上書きしない（`WorktreeChangedError`）

### データ消失
- [ ] マージのどの分岐でもローカルの内容が失われない（マーカー・別名保存・編集側を残す、のどれか）
- [ ] JSON・バイナリにコンフリクトマーカーを入れていない
- [ ] ブランチの更新は作業ツリーとインデックスの更新の後

### UI
- [ ] HTML 文字列を DOM に入れていない（`createEl` の `text` を使う）

### サプライチェーン
- [ ] lockfile の差分で、新しく入ったパッケージ（推移的依存を含む）を確認した。目的・メンテナ・install スクリプトの有無
- [ ] `pnpm-workspace.yaml` の `allowBuilds` が最小限（現在は esbuild のみ）で、`minimumReleaseAge` が外されていない
- [ ] バンドルサイズが前回から大きく変わっていない（変わったなら理由を説明できる）

## 4. 問題があったとき

- 修正が小さく明らかなら直して `pnpm check` と `pnpm security:scan` を再実行する
- 判断が要るもの（依存の入れ替えや仕様変更）はユーザーに報告して方針を確認する。その場合の結果は `fail`

## 5. 記録する

`.kit/harness/security/reports/YYYY-MM-DD.md` を次の形式で書く。

```md
# セキュリティチェック YYYY-MM-DD

- 対象 commit: <git rev-parse --short HEAD>
- 前回: <前回の date と commit / 初回>
- 結果: pass | partial | fail

## 機械的チェック
<pnpm security:scan の出力の要約。pnpm check の結果>

## 目視レビュー
<上の各セクションの判断。要対応があれば理由と対応>

## 依存
<pnpm outdated の要約、lockfile の差分で増えたパッケージ>

## 対応したこと / 残課題
```

`.kit/harness/security/last-check.json` を更新する。

```json
{
  "date": "YYYY-MM-DD",
  "commit": "<短縮 commit>",
  "result": "pass",
  "report": "reports/YYYY-MM-DD.md"
}
```

最後にレポートと `last-check.json` をコミットする（メッセージ例: `security: weekly check YYYY-MM-DD`）。

## 出力の段階

出力は [write-for-reader](../../../../.claude/skills/write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| チェックの記録 | 両方 | 4 |
| 問題の報告 | 人 | 4 |
