## 変更の要約

- 自作プラグインの画面の文言を英語にそろえた（ADR-0076）。View の段階名（Overdue、Previous boards、Due soon、Board）、ボタン、メニュー、ツールチップ、空のときの表示、コマンド名、リボンのツールチップ（Open today's daily note、Open Today、Open PKM Updates、Capture issues）、ステータスバーが英語になる
- 通知、取り消しのトースト、確認の文、エラーの説明、設定タブは日本語のまま
- コマンドの ID は変えていないので、ホットキーはそのまま使える。コマンドパレットで探すときの名前は英語になる
- README の「各端末の設定」に、Obsidian 本体の表示言語を English にする手順を足した（端末ごとの設定。コードでは変えない）
- 子への影響: 移行はない。各端末で Obsidian を開き直し、Settings → General → Language を English にする（任意）。画面の文言を確かめる（モバイルも）
