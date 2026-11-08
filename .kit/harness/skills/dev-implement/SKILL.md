---
name: dev-implement
description: 承認済みの計画に従って、テストを先に書いてから実装し、検査を通す手順。計画が承認された後、プラグイン・スクリプト・スキルを変えるときに使う。
---

# 実装する

## 前提

- 計画が承認されている。なければ先に [計画を立てる](../dev-plan/SKILL.md)
- main ではなく作業用のブランチにいる（[git の運用](../../docs/workflow.md#git-の運用)）

## 1. テストを先に書く

1. 完了の条件を 1 つ選び、それを確かめるテストを書く
   - プラグイン: `.kit/src/packages/<id>/test/`。マージのケースは `engine.test.ts` か `tree-merge.test.ts`（[プラグインの設計と開発](../../docs/plugin-development.md)）
   - ハーネスのスクリプト: `.claude/scripts/test/*.test.mjs`（`node --test`）
2. 実行して失敗することを確かめる。最初から通るなら、テストが条件を確かめられていない

## 2. 実装する

1. テストが通る最小の実装を書く
2. 通ったら、通ったまま整理する
3. 条件がなくなるまで繰り返す

## 3. 検査を通す

```sh
node .claude/scripts/verify.mjs            # ハーネスと Vault の検査
node .claude/scripts/verify.mjs --plugin   # プラグインを変えたとき（pnpm check も実行する）
```

- プラグインのソースを変えたら `pnpm build` し、`.obsidian/plugins/<id>/` のビルド成果物（`main.js` など）も一緒にコミットする
- 失敗したら原因を直し、すべてをもう一度実行する
- [セキュリティチェックが要る変更](../../docs/security-check-schedule.md)（依存、`src/git/`・`src/fs/`・`src/obsidian/`、ビルド設定、CI）なら、コミットの前に `security-check` スキルを実行する

## 4. コミットする

まとまりごとにコミットする。形式は [コミットの形式](../../docs/workflow.md#コミットの形式)。終わったら [PR を出す](../dev-pr/SKILL.md)。

## 守ること

- 範囲を広げない。ついでの修正をしたくなったら、別の作業として提案する
- テストを実装に合わせない（削除・スキップ・期待値の変更をしない）
- 検査を迂回しない。検査の側を変えて通さない。検査が誤っていると思ったら止めて伝える
- 規約にないことを推測で決めない
- 同じ失敗を 3 回直しても通らなければ、止めて伝える

## 出力の段階

出力は [write-for-reader](../../../../.claude/skills/write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 実装の完了の報告 | 人 | 1 |
