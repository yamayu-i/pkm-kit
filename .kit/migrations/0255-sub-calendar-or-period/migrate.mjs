/**
 * 0255: サブは Calendar の日（scheduled）か期間（start・end）のどちらか一方（.kit/src/docs/adr/0255-calendar-lane-and-sub-calendar-or-period.md）。
 * どちらを残すかはユーザーにしか決められないので、何も変えない。両方を持つサブは check.mjs が報告し、AI がユーザーに確かめて外す
 */
export function migrate(_root, { dryRun: _dryRun = false } = {}) {
	return [];
}
