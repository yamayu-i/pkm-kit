# 2026-11-16 Pick の in-progress と Watch の欄

## つまずき

- 起きたこと: 上流そのもの（`.kit-local/` がない）で作業していたのに、子のつもりで「`.kit/` は上流のものなので escalate する」と答え、あとで自分で訂正した。セッションの最初に読み込まれるのは子向けの `.claude/CLAUDE.md` で、上流か子かを見分ける手がかり（`.kit-local/` の有無）がその中の 1 行にしかない
- 改善案: SessionStart フックが、上流のとき「ここは上流（pkm-kit）。上流のハーネス `.kit/harness/CLAUDE.md` に従う」と出す

## 訂正

- 起きたこと: `isNext` の使い道を確かめずに「Inbox や Tickler の判定にも使われているので、`isNext` は変えず Pick 用の条件を別に作る」と提案した。ユーザーに「ロジックが散在するのは避けたいので、変えない理由を確認」と問われて調べると、使い道は Pick の 2 か所だけで、提案は誤りだった
- 改善案: 定義を変えない・別に作ると提案する前に、使っている箇所を検索して示す（dev-plan の「文脈を読む」に、変える関数の呼び出し元を確かめることを足す）

## 食い違い

- 起きたこと: ADR-0006 では `revisit` は someday のときだけとしているが、ADR-0025（get_overview）には「revisit が来た waiting / delegated」とある。task-coach の文書と `metrics.ts` は someday の `revisit` を見ている。Watch の並びに `revisit` を使う案を一度出し、実際には waiting では `statusPatch` が `revisit` を消すことが分かって取りやめた
- 改善案: ADR-0025 の記述を ADR-0006 に合わせる（#183 で status の規則を決め直すときに扱う）
