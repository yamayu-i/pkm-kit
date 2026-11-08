# 上流の更新の取り込み

- 種類: 手順（AI 経由）
- 開き方: セッションの開始時の知らせ、または「更新を取り込みたい」と頼む
- 場面: [仕組みの更新を取り込む](../jobs/kit-upgrade.md)

## 今の振る舞い

- SessionStart フックが、未取り込みの上流の更新と未適用の移行を知らせる
- AI が子向けの vault-upgrade の手順で、ブランチで上流を merge し、移行を実行し（スクリプトで済まない部分は移行の README に従って直す）、検査を通して PR にする
- PR の本文は、取り込む範囲で増えた `.kit/changes/` のファイルから書かれ、子への影響（移行、モバイルで確かめること）が入る
- 未適用の移行があると、検査と CI が失敗する

## 使う概念

[同期と snapshot](../concepts/sync-snapshot.md)

## 根拠

[ハーネスの ADR-0010](../../adr/0010-upstream-updates-and-migrations.md)、[ADR-0056](../../adr/0056-conflict-free-numbering.md)、子向けの [ハーネスの設計](../../../../../.claude/docs/harness.md)
