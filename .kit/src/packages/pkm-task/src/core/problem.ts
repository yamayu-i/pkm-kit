export type Severity = "error" | "warning";

/** lint やパースで見つかった問題 */
export interface Problem {
	severity: Severity;
	/** 問題のあるファイル（Vault ルートからのパス） */
	path: string;
	/** 機械的に扱うための識別子（例: `dangling-parent`） */
	code: string;
	message: string;
}
