# 同期と snapshot

## 目的

PC とスマホで同じ Vault を使い、どこで書いたものも失わない。

## 状態

Vault は git のリポジトリ。各端末の PKM Git が、未コミットの変更を snapshot としてコミットし、main に push する。

## 操作

pull、push、未解決のコンフリクトを一覧（コマンドとリボン）。

## 使い方の筋道

pull でも push でも、まず snapshot を取る。両方の端末で同じ行を変えると、マーカーを入れたまま同期し、止まらない。後で PC で解く。マーカーを入れられないファイルはリモート側を採り、手元の版を別名で残す。

## 根拠

[プラグインの設計と開発](../../plugin-development.md)、[ADR-0028](../../../../src/docs/adr/0028-auto-updated.md)
