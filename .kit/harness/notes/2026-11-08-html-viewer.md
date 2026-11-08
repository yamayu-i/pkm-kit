# 2026-11-08 HTML の表示（vault-html）

## つまずき

- 起きたこと: PR の前に main を取り込んだら、作業中に main で ADR-0035・0036 と移行 0004 が使われていて、番号が重なった。ADR は dev-pr に「重なったら振り直す」とあるが、移行の番号には触れていない。移行の番号は、移行のディレクトリ名・`check` の失敗の名前・テストの「0004 までを適用済みにする」記録・CHANGELOG・ADR の影響の節に散らばっていて、振り直す箇所が多かった
- 改善案: dev-pr の「最新の main を取り込む」に、移行の番号も同じように振り直すことと、振り直す箇所（ディレクトリ名、テスト、CHANGELOG、ADR、移行の README の見出し）を書く。並行する作業が多いので、ADR と移行の番号は PR の直前に決める運用も考えられる

## つまずき

- 起きたこと: vault-html の preview で、外部への要求を Playwright の `request` イベントで数えたら、CSP で止まった要求も出てきて、CSP が効いていないように見えた（失敗の理由が `csp` で、ネットワークには届いていない）。route に届いた要求だけを数えるように直した
- 改善案: 直した（preview の `open` のコメントに書いた）。ブラウザの守りを確かめる検査を新しく書くときの注意として、プラグインの設計と開発の文書に載せるかは kit-review で決める

## つまずき

- 起きたこと: この環境の Playwright（1.64.1）が求める版の Chromium がなく、preview が起動しなかった。別の版の Chromium は入っていた。vault-html の preview に `CHROMIUM_PATH` を足して動かした。vault-task の preview:ui には足していない。Node も `mise.toml`（26）と違う 22 だった（escalation #4 と同じ）
- 改善案: vault-task の preview にも同じ逃げ道を足すか、Chromium の入れ方を文書にそろえる
