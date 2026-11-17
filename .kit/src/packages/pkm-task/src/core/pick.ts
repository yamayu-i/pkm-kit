import { isWatchStatus } from "./index";
import type { Status } from "./schema";
import { isDoneStatus } from "./status-log";

/** issue 画面の Pick・タイマーのボタンを決める材料（ADR-0165, 0203） */
export interface PickTimerState {
	status: Status;
	/** 今日のボードに載っている */
	picked: boolean;
	/** 記録中 */
	running: boolean;
	/** Next（issue は isNext、サブは isNextSub） */
	next: boolean;
	/** 期間を決めれば Next になるサブ（needsPeriod） */
	needsPeriod: boolean;
}

/**
 * issue と上下のサブで共通（ADR-0203）。記録中は、完了後や日をまたいでも停止できる。
 * 終わったもの・待ち（Resume は status のボタン）・someday には出さない。今日のボードにあれば再生、Next なら Pick（何も書き換えない）、
 * 期間を決めれば Next になるサブは Timeline。それ以外（Inbox・Calendar・Tickler、Next でない親のサブ）には出さない
 */
export function pickTimerControl(s: PickTimerState): "pick" | "start" | "stop" | "timeline" | null {
	if (s.running) return "stop";
	if (isDoneStatus(s.status) || isWatchStatus(s.status) || s.status === "someday") return null;
	if (s.picked) return "start";
	if (s.next) return "pick";
	if (s.needsPeriod) return "timeline";
	return null;
}

/**
 * status のボタン（ADR-0183）を出すか（ADR-0203）。Start（open → in-progress）は、今日のボードに載せた（Pick した）ものにだけ出す。
 * ほかの status のボタン（Close・Resume・Reopen・↩）はいつも出す。status のメニューは変えない
 */
export function showsPrimaryStep(status: Status, onBoard: boolean): boolean {
	return status !== "open" || onBoard;
}
