# 変更の記録

子の Vault から見える変更と、移行を書く。新しいものを上に足す。`vault-upgrade` がこれを読んで、取り込みの PR の本文を書く（ADR-0010）。

各項目に、子への影響（移行の有無、モバイルで確かめること）を書く。

## 移行の仕組みと vault-upgrade

- 上流の更新を取り込む `vault-upgrade` のスキルを足した。merge と、移行（`.kit/migrations/`）の実行で取り込む
- `node .kit/migrate.mjs`: 未適用の移行を実行する。`verify.mjs` と CI は、未適用の移行があると失敗する
- SessionStart フックが、未取り込みの上流の更新と未適用の移行を知らせる
- `setup.mjs` は、移行を適用済みにせず、実行するようになった
- **移行 0001-template-overrides**: 子の `template/` から、切り出した時点の上流と同じ中身のテンプレートを消し、`template/config.json` を上流と違う項目だけにする。上流のテンプレートの改善が届くようになる
- 子への影響: 移行 0001 を実行する。モバイルで確かめることはない

## ハーネスの親子分離（pkm-kit #3）

- 子向けのハーネス（`.claude/`）と上流のハーネス（`.kit/harness/`）に分けた
- 子の改善のサイクル: `harness-note`（直す先を書く）、`harness-review`（子で直すものと上流に伝えるものに振り分ける）、`escalate`（上流に伝える）
- 子だけの規約とスキルは `.claude/local/CLAUDE.md` と `.claude/skills/local-*` に置く
- 子への影響: 移行なし。`node .kit/setup.mjs` を実行し直すと `.claude/local/CLAUDE.md` が置かれる

## テンプレートの重ね合わせとセットアップ（pkm-kit #2）

- テンプレートの既定を `.kit/templates/` に移した。子の `template/` は、同じ名前のファイルと設定の項目を上書きする
- `node .kit/setup.mjs`: エスカレーションの方法、取り込んだ上流のコミット、Obsidian の設定に必要なキー、初期値、pre-commit フック
- 子の検査: 上流のものを変えていないか、Obsidian の設定に必要なキーが入っているか
- 子への影響: vault-template の `main.js` が変わった。モバイルでテンプレートのモーダルと設定画面が開けるかを確かめる

## 上流の構成（pkm-kit #1）

- プラグインのソースを `.kit/src/` に移した。Vault で使う CLI を `.kit/bin/` に置いた（ビルド不要）
- updated の付与の規則を vault-git の `stamp/updated.ts` に一本化した。pre-commit フックは `.kit/bin/stamp-updated.mjs` を呼ぶ
- 子への影響: 移行なし
