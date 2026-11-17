# 2026-11-17 issue 画面の Pick と Start を Next に沿わせる

## 訂正

- 起きたこと: Next でないものを確認のダイアログで Next に書き換えて Pick する動き（ADR-0165）を、残す前提の選択肢として説明した。ユーザーから「負の遺産で、実際不要でノイズになる機能なので完全に忘れてほしい」と言われた
- 改善案: なし（ADR-0203 で置き換えた）

## 訂正

- 起きたこと: 期間の外のサブを Pick するとき、今日を期間に入れるダイアログを出す案に沿って設計した。ユーザーから「ユーザが意図しない入力を勝手にやる挙動は UX として望ましくない。何もせず Timeline に遷移する」と直された
- 改善案: プロダクトの文書（strategy か design）に「ユーザーが入力していない値を、確認を挟んでも自動で書き込まない。直す場所に案内する」という原則を書く

## 訂正

- 起きたこと: 変更の対象を Daily の Pick まで広げて、作業が途中で切れることを心配した。ユーザーからは「Daily の Pick は対象ではなく、issue 画面の Pick ボタンが対象」と言われた
- 改善案: なし（依頼の範囲を先に確かめる）

## 食い違い

- 起きたこと: ユーザーは「Daily の Pick には、Next であれば issue 本体が出る」と思っていた。実際には ADR-0150 で、サブを持つ issue（Project）は行に出さず、Next のサブがなければ Project ごと消えていた
- 改善案: ADR-0203 で「Projects without a next action」を足して塞いだ。surfaces/task-today.md にも書いた

## つまずき

- 起きたこと: `pnpm --filter pkm-task preview:ui` が、クラウドの環境で Playwright の Chromium を見つけられずに落ちた。`CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux64/chrome` を渡すと動いた
- 改善案: preview.mjs のコメントにはあるが、上流のハーネスのコマンド一覧にも CHROMIUM_PATH のことを書く
