# ADR-0076: 自作プラグインの UI の言語を英語に寄せ、読ませる文だけ日本語にする

- 状態: 承認
- 日付: 2026-11-08

## 背景

同じ画面の中で英語と日本語の文言が混ざっていた（[#36](https://github.com/yamayu-i/pkm-kit/issues/36)）。

- Today: 段階の名前は日本語（期限切れ、前回のボード、期限が近い、ボード）、操作は英語（Add Do Date、Close、Cancel）
- task board: 「ボードを締める」「完了」「未分類」は日本語、status は英語（open、in-progress）
- Organize: 「予定を入れる」「あとで」「もう終わっていた」は日本語、「Cancel」は英語
- pkm-template のヘッダーと一覧は英語（ADR-0027）。コマンド名とリボンのツールチップは日本語

言語の決まりは、ADR-0027 がヘッダーのラベルを、ADR-0032 が日付の操作名を決めただけで、文言を足すたびにどちらにするかを判断していた。Obsidian 本体の表示言語も決めていなかった。

ADR-0036 は別の内容ですでにあるので、この ADR は [#76](https://github.com/yamayu-i/pkm-kit/issues/76) の番号で書く（ADR-0056）。

## 決定

### 英語にするもの（画面に常に出る短い文言）

- View の名前、見出し、段階の名前（Overdue、Previous board、Due soon、Board など）
- ボタン、メニュー、操作の名前（「ボードを締める」→ Close board、「予定を入れる」→ Schedule など）
- 項目の名前と値の表示（status、label の見出し、Done、Unsorted など）
- ツールチップ、`aria-label`、プレースホルダ、空のときの短い表示（No issues など）
- コマンドパレットのコマンド名、リボンのボタンのツールチップ、ステータスバー

### 日本語のまま残すもの（読ませる文）

- 通知（Notice）、取り消しのトースト、確認のモーダルの文、エラーの説明
- 設定タブ（項目の名前と説明）

### 対象外

- 利用者が書いたもの（ノートの本文、title、summary、label の名前）と、ファイルに書かれる値（すでに英語）
- ハーネスの文書、ADR、スキル、Claude の返事（日本語のまま）

### Obsidian 本体の表示言語

- 英語を既定にする。README の「各端末の設定」に、Settings → General → Language を English にする手順を書く
- コードでは変えない。表示言語は Vault の `.obsidian/*.json` ではなく端末の localStorage にあり、変えるとその端末のほかの Vault も英語になるため（ユーザーと合意）

## 理由

- 画面に常に出る文言を英語にそろえると、Obsidian 本体（英語）、ファイルの値（status など）、ADR-0027・0032 で英語にしたラベルと操作名と、一つの言語で読める
- 通知・確認・エラーは、何が起きたか・どうすればよいかを読ませる文で、利用者の母語のほうが早く正しく読める。設定は一度しか触らず、説明が長い
- 分ける基準が「常に出る短い文言か、読ませる文か」なので、文言を足すときに迷わない

## 却下した案

- **画面の文言をすべて日本語にする**: ファイルの値（open、in-progress）や Obsidian 本体と食い違う。ユーザーは英語寄りを望んだ
- **通知と設定も英語にする**: ユーザーが日本語で残すことを選んだ
- **プラグインが Obsidian の表示言語を英語に書き換える**: 端末のほかの Vault にも効き、利用者が日本語に戻しても上書きしてしまう

## 影響

- 自作プラグインの文言を、この決まりに合わせて直す（pkm-task、pkm-template、pkm-git、pkm-drawio、pkm-ribbon、pkm-updates、pkm-html）。テストと UI の検査（`preview:ui`）の期待値も直す
- ADR-0029・#38 のリボンのツールチップ（「今日のデイリーノートを開く」「今日のタスクを開く」など）も英語にする（Open today's daily note、Open Today など）
- `.kit/src/docs/design.md` に、この決まりを書く。`.kit/harness/docs/product/concepts/README.md` の用語の表と `surfaces/` の文言を直す
- README: 各端末の設定に表示言語の手順を足し、Obsidian の画面の名前を英語の表記にする
- 子: 移行はない。プラグインを更新すると画面の文言が変わる
