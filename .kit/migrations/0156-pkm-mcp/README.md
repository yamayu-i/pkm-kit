# 0156-pkm-mcp: MCP サーバーの名前を pkm にする

## 何が変わったか

MCP サーバー（`.kit/bin/mcp.mjs`）が、タスク管理だけでなく、ノート・デイリーノート・wiki・検査も扱うようになり、名前が `pkm` になった（[ADR-0156](../../src/docs/adr/0156-pkm-mcp.md)）。ツールに群の接頭辞が付く（`get_overview` → `task_get_overview` など）。旧名も 1 版のあいだ呼べる。

あわせて、使われ方を子の `.claude/mcp-log/` に記録するようになった（呼び出し、MCP を通さないノートの読み書き、AI からのフィードバック）。harness-review が集計を読み、上流で直すものを escalate で伝える。

## スクリプトが行うこと

- Vault ルートの `.mcp.json` で、`.kit/bin/mcp.mjs` を `pkm` 以外の名前（`pkm-task` など）で登録していたら、`pkm` に改める。引数はそのまま
- `.mcp.json` がなければ何もしない

## スクリプトで扱えない場合に AI が行うこと

- `.mcp.json` がなく、MCP サーバーを別の場所（`claude mcp add` で入れたユーザーの設定、Cursor の設定など）に登録しているなら、ユーザーに確かめてから、名前を `pkm` に改める。`.mcp.json` に移したいと言われたら `node .kit/setup.mjs` を実行する（`.mcp.json` がなければ置く）
- `.mcp.json` が JSON として読めないなら、変えずに止める。ユーザーに見せて直してから、移行し直す
- 子だけのスキルや `local/CLAUDE.md` が旧名のツール（`get_overview` など）を書いていれば、接頭辞付きの名前に直す
- `.claude/mcp-log/` はコミットする（端末間で同期し、harness-review で読む）。記録を止めたいときは、環境変数 `PKM_MCP_LOG=off`

## 確かめ方

```sh
node .kit/migrate.mjs --status
cat .mcp.json   # mcpServers に pkm がある
```
