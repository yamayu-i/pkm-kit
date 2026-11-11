# パターンと規約の保守

パターンと規約は、使った記録（気づき、レビューのコメント）を見て足す・消す・直す。上流のものなので、子の Vault では変えず、[escalate](../escalate/SKILL.md) で伝える。

## 正本

| もの | 正本 | 揃えるもの |
|---|---|---|
| パターンの id・名前・逆引きの 1 文・要る部品 | `.kit/src/packages/slide/src/core/patterns.ts` | `patterns/<id>.md`、[SKILL.md](SKILL.md) の逆引きの表、`src/style/patterns.css` |
| ひな形 | `patterns/<id>.md` の最初の html のコードブロック | テストと見本のデッキは、ここから作る（写しを持たない） |
| 部品の見た目 | `.kit/src/packages/slide/src/style/*.css` | [authoring.md](authoring.md) の部品の一覧 |
| 機械的な検査と文字の量の目安 | `.kit/src/packages/slide/src/core/build.ts`（`LIMITS`、`MAX_ITEMS`） | [conventions.md](conventions.md) の「検査」の列 |
| 規約の根拠 | [evidence.md](evidence.md) | [conventions.md](conventions.md) の根拠の ID |

`pnpm --filter slide test` が、パターンの一覧・文書・逆引き・CSS の食い違いと、ひな形がエラーも警告もなくビルドできることを確かめる。

## パターンを足す

足す条件: 既存のパターンの部品の組み合わせでは表せない伝え方が、2 回以上出た。

1. `patterns.ts` に 1 行足す（`id`、分類、名前、逆引きの 1 文、`requires`）
2. `patterns/<id>.md` を書く。節は「使う場面」「使わない場面」「ひな形」「書くときの指示」「よくある失敗」「根拠」。ひな形は、実際の話として読める中身にする（「タイトル」「テキスト」と書かない）
3. 配置が要るなら `patterns.css` に足す。長さは `u`、色・角丸はトークン（`--vt-*`、`--sl-*`）。値を直接書かない
4. [SKILL.md](SKILL.md) の逆引きの表に 1 行足す
5. `.kit/src` で `pnpm --filter slide build && pnpm --filter slide test`、`pnpm --filter slide preview:ui` を実行し、`preview/out/sheet-*.png` を見て確かめる（ライト・ダーク・読む用）

## パターンを消す・直す

- 消す条件: 使われない、または別のパターンと取り違えられ続ける。消すと、そのパターンを使う子のデッキがビルドできなくなるので、`.kit/changes/` に書き、置き換え先を示す
- ひな形や指示を直すだけなら、`patterns/<id>.md` を直してテストを通す

## 規約を足す・直す

- 規則にしてよいのは、[evidence.md](evidence.md) の「採った根拠」にあるものだけ（一次資料の本文で確かめ、確度が高か中のもの）。新しい根拠は、確かめ方と確度を書いて evidence.md に足してから、規約に使う
- 根拠のない目安（日本語の字数など）を置くときは、[conventions.md](conventions.md) に「この規約の目安」と明記し、注意書きに足す
- 機械的に分かる規則は、`build.ts` の検査にする（警告。エラーにするのは、壊れるものと、値の直書きだけ）
