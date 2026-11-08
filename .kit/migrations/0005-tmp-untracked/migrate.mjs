/**
 * 0005: tmp/ を git で管理しない（.kit/src/docs/adr/0037-tmp-folder.md）。
 * 追跡を外すと、次に同期したほかの端末からファイルが消えるので、スクリプトは何も変えない。
 * 追跡中の tmp/ のファイルがあれば、check が一覧を出して止まる（README の「スクリプトで扱えない場合」）
 */
import { trackedTmpFiles } from "./common.mjs";

export function migrate(root) {
	const files = trackedTmpFiles(root);
	return files.length ? [`追跡中の tmp/ のファイルが ${files.length} 件ある。移すか追跡を外すかを決める（README）`] : [];
}
