# ADR-0121: 子の Vault ごとに基本の色を変えられるようにする

- 状態: 承認
- 日付: 2026-11-12

## 背景

プラグインと Obsidian 本体の色は、上流の `tokens.json` だけで全 Vault 共通に決まっている（ADR-0016）。値は各プラグインの `styles.css` にビルドで書き込まれ、Obsidian 本体の色は上流のスニペット `pkm-theme.css` で固定され、`accentColor` は `.kit/obsidian-required.json` で値が決まる。子はプラグインをビルドしないし、どれも上流のものなので、子ごとに色を変える手段がない。

変えたいのは、Vault を見分けるためのアクセントと、面の色味（基本の色）。状態の色（status・期限・エラーの色相）は意味を持つので、Vault ごとに変わると困る。どの色も、design.md のコントラストの規約を守ったままでないといけない。

## 決定

- **上書きできる色を決める**: `tokens.json` の色に `vault: true` を付けたものだけを、子が上書きできる。対象は面（`surface`、`surface-container`、`surface-container-high`、`secondary-container`）、文字（`on-surface`、`on-surface-variant`、`on-secondary-container`、`text-faint`）、枠（`outline`）、アクセント（`primary`、`on-primary`）。色相、`scheduled`、期限、`error`、`on-label` は上書きできない
- **元の色から作る色は自動で追従させる**: `outline-variant`・`state-hover`・`state-press`（on-surface の半透明）、`primary-state-hover`（primary）、`on-primary-state-hover`（on-primary）には、新しい拡張 `derive`（元の色のパス）を付ける。色相は元の色と同じにし、透明度だけを自分で持つ。読み込みでは、値が元の色と食い違っていないかを確かめる。`focus-ring` は今の別名（`{color.primary}`）のまま
- **子の設定**: `.kit-local/theme.json` に、ライトとダークそれぞれの上書きを書く（`{ "light": { "primary": "#..." }, "dark": { ... } }`）。書いていない色は上流の値のまま。キーは `vault: true` の色の名前だけ
- **反映のしかた**: 子のスニペット `.obsidian/snippets/pkm-theme-local.css` を CLI（`node .kit/bin/theme.mjs build`）で作る。このスニペットは、上書きした色と追従する色について、プラグインの `--vt-*` と Obsidian 本体の変数（トークンの `obsidian`）の両方を書く。セレクタを `html body.theme-light` / `html body.theme-dark` にして、プラグインの `body` / `body.theme-dark` と `pkm-theme.css` より強くする。スニペットの読み込み順に頼らないため。CLI は、`appearance.json` の `enabledCssSnippets` に `pkm-theme-local` を足し、`accentColor` を上書き後の primary（ライト）に合わせる
- **規約に合わない組み合わせは選べなくする**: 上流の値に上書きを重ねたすべてのトークンで、`contrast` の条件（ライト / ダーク）と、面の段差の順（ライトでは surface ≥ surface-container ≥ surface-container-high の明るさ、ダークではその逆）を確かめる。1 つでも外れたら、CLI は何も書かずに、外れた組み合わせと比を出して止まる。色相の印（green など）が新しい面の上で 3:1 を割る場合も止める。状態の色は変えられないので、面の側を直すことになる
- **検査**: 子の `verify.mjs` は、`theme.json` が規約を満たすか、スニペットが `theme.json` から作り直したものと同じか（手で直していないか）、`appearance.json` が合っているかを確かめる。`theme.json` がない子では何もしない。`check-obsidian-config` は、`theme.json` があれば、`accentColor` を上書き後の primary と比べる
- **対象外**: 生成済みのスライド（`slide/`）、書き出した html（`tmp/`）、図（pkm-diagram が描く SVG と PNG）は、上流の値のまま。これらは Vault の外でも同じに見えるように値を埋め込むもので、今回は変えない

## 理由

- プラグインのビルドを子でしないまま、すべてのプラグインと Obsidian 本体を一度に変えられるのは、CSS 変数を上書きするスニペットだけ。プラグインの CSS はすでにトークンを `var(--vt-*)` で読んでいる
- 上書きできる色を `tokens.json` に印として持てば、上流が色を足したときに「子が変えてよいか」を同じ場所で決められ、一覧の文書にも出せる
- 状態の色を固定し、面の側で合わせさせれば、status や期限の色の意味は全 Vault で同じに保てる
- コントラストの条件は、すでに `tokens.json` にすべて書いてある（`contrast.on`）。上書きを重ねてから同じ検査を通すだけなので、規約と検査が食い違わない

## 却下した案

- **プラグインが設定画面で色を選ばせ、実行時に CSS を差し込む**: 全プラグインに同じ処理が要り、Obsidian 本体の変数と `accentColor` は別に合わせる必要がある。検査（`verify.mjs`、CI）を通らない値も保存できてしまう
- **用意したパレットから選ぶだけにする**: 確実だが、Vault ごとに好きな色にしたいという目的に合わない。規約の検査があれば、自由な値でも規約は守れる
- **`tokens.json` 全体を子で上書きできるようにする**: 色相や期限の色まで変わり、色の意味が Vault ごとに変わる
- **子のスニペットを `pkm-theme.css` の後に読み込ませて、同じセレクタで上書きする**: スニペットとプラグインの CSS の読み込み順に頼ることになる。プラグインの `body.theme-dark` と強さが同じなので、順番が変わると効かなくなる
- **スライドと書き出した html も子の色にする**: 生成済みのものは作り直しが要る。今回は求められていない

## 影響

- `tokens.json` に `vault` と `derive` の拡張が増える。読み込み・一覧の文書・テストを直す
- 新しい CLI `.kit/bin/theme.mjs` を design パッケージからビルドしてコミットする（esbuild は slide などと同じ版）
- 子の `.obsidian/snippets/pkm-theme-local.css` と `.kit-local/theme.json` は子のもの。`theme.json` がない子は、今までと見た目も検査も変わらない。移行は要らない
- design.md の「Obsidian 側の固定」に、子のスニペットを 1 つ足してよいことを書く。上流そのものは `pkm-theme` だけのまま
- プラグインの CSS がトークンを使わずに色を書いていると、そこだけ追従しない。今も `css-lint` でトークン以外の色を禁じているので、起きないはず
