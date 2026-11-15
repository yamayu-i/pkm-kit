# Members と member 画面

- 種類: 一覧 View・ノートのヘッダー
- 開き方: コマンド「Open Members」と、委任先へのリンク
- 場面: [作業しながら残す](../jobs/task-work.md)

## 今の振る舞い

Members は委任先を一覧で探し、member ノートを開きます。member のヘッダーで本名、呼び名、alias、label を確認・編集します。委任した issue の一覧から、誰の返事を待っているかを辿れます。チームの共同作業や相手への通知を行う仕組みではありません。

## 使う概念

[委任先](../concepts/task-member.md)、[issue](../concepts/task-issue.md)

## 根拠

[ADR-0007](../../../../src/docs/adr/0007-labels-and-members.md)

## 入力と制約

member は m-N の ID、本名、nickname、alias、label を持ちます。alias に先頭の @ は付けません。

## 操作と保存

委任先のノートへ項目を保存します。issue の delegated_to は member の ID を指し、委任先の表示から関連する仕事を確認します。

## 失敗時と戻し方

候補が見つからない場合は ID・alias・名前を確認します。委任先を直しても、issue の本文を自動では書き換えません。

## 端末の違い

PC とスマホで名前や別名から探せます。実在の人物の個人情報をこの定義書の画面例には使いません。
