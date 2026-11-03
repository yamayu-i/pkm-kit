---
name: vault-upgrade
description: 上流（pkm-kit）の更新を子の Vault に取り込む手順。ブランチで upstream/main を merge し、未適用の移行を実行して（スクリプトで済まない部分は README に従って直し）、検査を通して PR にする。SessionStart フックが上流の未取り込みの更新や未適用の移行を知らせたとき、ユーザーが上流の新しい機能を使いたい・更新を取り込みたいと言ったときに使う。
---

# 上流の更新を取り込む

上流の更新は、merge と移行で取り込む（[ADR-0010](../../../.kit/harness/docs/adr/0010-upstream-updates-and-migrations.md)）。上流のもののファイルは merge だけで新しくなる。上流の変更が子のもの（ノート、`template/`、`.obsidian/*.json` など）に手を入れる必要を生むときは、上流が移行（`.kit/migrations/`）を付けている。

マージはユーザーが行う。モバイルは、マージされた後に vault-git で pull するだけでよい。

## 0. 前提を確かめる

- `.kit-local/upstream.json` がある（なければ `node .kit/setup.mjs`）
- 上流の remote がある: `git remote get-url upstream`（なければ `git remote add upstream <.kit/kit.json の url>`）
- 作業ツリーがきれい。端末の snapshot を取り込んでおく: `git pull --rebase origin main`

## 1. 取り込む

```sh
git fetch upstream
git log --oneline <.kit-local/upstream.json の commit>..upstream/main   # 取り込む変更の一覧
git checkout -b upgrade-YYYY-MM-DD origin/main
git merge upstream/main
```

- `.kit/CHANGELOG.md` の差分を読み、取り込む変更と移行を把握する
- 衝突したら、ファイルが上流のものか子のものかで解く（`.kit/owned-paths.json`）
  - 上流のもの: 上流の版を採る（`git checkout --theirs -- <パス>`）。子で変えていたなら、それは境界の違反なので、変えていた内容を [escalate](../escalate/SKILL.md) で伝える
  - 子のもの: 上流には子のものがないので、ふつうは衝突しない。衝突したら止めてユーザーに伝える
- DailyNote の本文は、衝突の解消でも変えない

## 2. 移行を実行する

```sh
node .kit/migrate.mjs --dry-run                       # 何が変わるかを見る
node .kit/migrate.mjs --upstream=upstream/main        # 実行し、取り込んだ上流のコミットを記録する
```

- `check.mjs` が失敗して止まったら、表示された `README.md`（`.kit/migrations/NNNN-名前/README.md`）の「スクリプトで扱えない場合」に従って直し、もう一度実行する。続きから進む
- 直すのに判断が要る（ユーザーのノートの内容を変える、どちらを残すか決める）ときは、止めてユーザーに確かめる
- AI でも直せないときは、ここで止める。上流に [escalate](../escalate/SKILL.md) する（移行の名前、`check.mjs` の出力、汎用にした再現の手順）

## 3. 検査を通す

```sh
node .claude/scripts/verify.mjs
```

すべて通るまで直す。上流のものを変えて通すことはしない（境界の検査が止める）。

## 4. PR にする

- コミット: `vault(upgrade): 上流 <短い commit> を取り込む`。マージコミットと、移行による変更のコミットに分けてよい
- PR の本文:
  - 取り込んだ上流の範囲（前の commit → 新しい commit）と、`.kit/CHANGELOG.md` の要約
  - 実行した移行と、変わったファイル
  - AI が判断して直した箇所（移行の README に従ったもの）
  - 上書きしているテンプレート（`template/file/`）があれば、その一覧（上流の版との差をユーザーが見られるように）
  - モバイルで確かめること（プラグインの `main.js` が変わったときは、pull して開けるか）
- PR を出したら、URL と検査の結果をユーザーに伝える

## 最初の取り込みについて

上流を切り出す前から使っている Vault は、上流と共通の祖先がない。最初の 1 回だけ `git merge --allow-unrelated-histories upstream/main` を使い、上流のものは上流の版を、子のものは子の版を採る（[ADR-0009](../../../.kit/harness/docs/adr/0009-upstream-and-child-vaults.md) の 5）。その後に `node .kit/setup.mjs` を実行すると、移行も実行される。
