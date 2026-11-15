/** 入力欄の下書きの状態。dirty は、まだ保存していない入力があるか */
export interface DraftState {
	draft: string;
	dirty: boolean;
}

/**
 * 保存された値（value）が戻ってきたときの、下書きの扱い（ADR-0161）。
 * value が下書きそのもの、または下書きを保存のときの整形（normalize）にかけたものなら、下書きは残して保存済みにする
 * （整形で消えた末尾の空白を、入力中の欄に書き戻さない）。入力中でなければ、ほかで変わった値を取り込む
 */
export function adoptValue(state: DraftState, value: string, normalize: (v: string) => string): DraftState {
	if (value === state.draft || value === normalize(state.draft)) return { draft: state.draft, dirty: false };
	if (!state.dirty) return { draft: value, dirty: false };
	return state;
}
