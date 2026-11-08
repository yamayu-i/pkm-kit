/**
 * 段階表示（DailyTaskView の上部）の各段階の見せ方。
 * 今の段階だけ名前と件数を出し、ほかは番号（済みはチェック）の丸に縮める。
 * 縮めた段階の名前と件数は、ツールチップと読み上げ（title / aria-label）で分かるようにする。
 */

export type StepState = "current" | "done" | "todo";

export interface StepperItem<K extends string> {
	key: K;
	number: number;
	label: string;
	state: StepState;
	/** 番号の丸だけにする（今の段階以外） */
	compact: boolean;
	count: number;
	/** ツールチップと aria-label */
	title: string;
}

export function stepperItems<K extends string>(steps: readonly { key: K; label: string }[], current: K, counts: Record<K, number>, passed: ReadonlySet<K>): StepperItem<K>[] {
	return steps.map((s, i) => {
		const count = counts[s.key];
		const state: StepState = s.key === current ? "current" : count === 0 || passed.has(s.key) ? "done" : "todo";
		const detail = state === "done" ? (count > 0 ? `Done · ${count}` : "Done") : `${count}`;
		return { key: s.key, number: i + 1, label: s.label, state, compact: state !== "current", count, title: `${i + 1}. ${s.label} (${detail})` };
	});
}
