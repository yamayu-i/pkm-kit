---
name: escalate
description: 子の Vault で見つけた、上流（pkm-kit）を変えないと直らない問題を、この Vault で決めた方法（Issue・ファイル・記録だけ）で上流に伝える手順。上流のスキル・文書・検査・プラグイン・テンプレートの既定の誤りや不足、上書きの手段がないこと、移行の失敗に気づいたとき、上流のものを直したくなったとき、harness-review で直す先を上流にしたときに使う。
---

# 上流に伝える（エスカレーション）

上流のもの（`.kit/owned-paths.json` に当たるファイル）は、この Vault では変えない。直したいことは、ここで上流に伝える（[ADR-0011](../../../.kit/harness/docs/adr/0011-harness-parent-and-child.md)）。上流で直ったものは、上流の更新を取り込むとこの Vault に届く。

## 1. 方法を確かめる

`.kit-local/config.json` の `escalation` を読む。セットアップ（`node .kit/setup.mjs`）で決めたもの。

| method | 動き |
|---|---|
| `issue` | 上流（`repo`）に GitHub の Issue を立てる。ラベルは `label`（既定は `escalation`） |
| `file` | `.kit-local/escalations/YYYY-MM-DD-<英語の短い名前>.md` に書く。上流に伝えるのは人が行う |
| `none` | 送らない。評価のレポート（`.claude/reviews/`）に「上流の改善」として残す |

なければ、ユーザーに `node .kit/setup.mjs --escalation=issue|file|none` を案内する。

## 2. 下書きを書く

上流は**公開**リポジトリ。方法によらず、次を守る。

- 個人のノートの内容、ノートのファイル名、端末名、人の名前、秘密情報を入れない。再現の手順は、汎用の例（「`daily/` のノートで」「label が 2 つある Vault で」など）で書く
- この Vault の好みを、上流の改善として送らない。好みを実現する上書きの手段がないなら、「上書きの手段がほしい」ことを送る

下書きの形:

```markdown
## 起きたこと
<上流のどの機能で、何をして、何が起きたか。汎用の例で>

## 関係する上流のもの
- <ファイル・スキル・移行のパス（例: .claude/skills/wiki-daily/SKILL.md）>

## 期待すること
<どうなってほしいか。案があれば>

## 取り込んでいる上流
- コミット: <.kit-local/upstream.json の commit>
- 適用済みの移行: <migrations の最後>

## この Vault での回避
<上流のものは変えずに、子のもの（local-* など）で回避したなら、その方法。なければ「なし」>
```

## 3. 確認してから送る

- 下書きをユーザーに見せ、送ってよいかを確かめる（外に出す操作なので、毎回確かめる）
- `issue` のときは、先に上流の Issue を検索する（`gh api -X GET search/issues -f q='repo:<repo> is:issue <言葉>'` など）。同じ件があれば、新しく立てずにその Issue にコメントする
- 送る: `issue` は GitHub の MCP ツールか `gh` で Issue を作る（ラベルが付けられなければ、本文の先頭に `escalation` と書く）。`file` はファイルを書く

## 4. 記録する

`.kit-local/escalations.json` に 1 件足す（なければ `[]` から作る）。

```json
[{ "date": "YYYY-MM-DD", "method": "issue", "ref": "yamayu-i/pkm-kit#12", "summary": "<一行の要約>", "note": ".claude/notes/<元の気づき>.md" }]
```

- `file` のときは `ref` にファイルのパス、`none` のときは `ref` に評価のレポートのパスを書く
- 元の気づき（`.claude/notes/`）には「エスカレーションした（ref）」と追記する。消すのは評価のとき
- 記録のコミットは `harness(note): <要約> をエスカレーションした`（気づきの記録と同じく main に直接コミットしてよい）

## 送った後

- 上流からの返事（Issue のコメント、Close）は、月 1 回の [harness-review](../harness-review/SKILL.md) で確かめる
- 上流で直ったら、上流の更新を取り込んだ後に効いているかを確かめる

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 上流に伝える Issue・ファイルの本文 | 両方 | 3 |
| 送る前にユーザーに見せる下書き | 人 | 3 |
