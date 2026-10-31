# ADR-0007: label の定義ファイルと、委任先（member）

- 状態: 承認
- 日付: 2026-10-31

## 決定

### label

- issue の `label` には**名前**で書く
- 色の定義は `issue/labels.json` に置く: `[{"name": "仕事", "color": "#d0d0d0"}]`。色の既定値は薄いグレー
- Obsidian の `tags` は使わず、独自の欄にする

### member

- 委任先は `member/m-N.md`（`type: member`, `id`, `name`）
- issue の `delegated_to` に member の ID を入れる。`status-detail` は、どの status でも 20 文字以内の自由記述
- status を `delegated` にしたとき、または委任先の欄をクリックしたときに、member を名前で検索するか、新しく作るモーダルを出す

## 理由

- nanoId で参照すると、frontmatter を人も LLM も読めない
- `status-detail` の意味が status によって変わると、検索も表示もややこしくなる
- member のノートは、人物のノートとして wiki の一部になる

## 影響

- label を改名するときは、プラグインが全 issue の `label` を書き換える
