/** 0006 が終わった状態か。git が追跡している tmp/ のファイルが残っていれば、それを返す */
import { trackedTmpFiles } from "./common.mjs";

export function check(root) {
	return trackedTmpFiles(root).map((p) => `${p}: git が追跡している（README の「スクリプトで扱えない場合」）`);
}
