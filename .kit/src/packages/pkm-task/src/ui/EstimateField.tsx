import { useEffect, useState } from "preact/hooks";
import { formatMinutes, parseDurationInput } from "../core/format";

/** 見積もりの入力の文字を分にする。空は null（消す）。読めなければ undefined */
export function parseEstimate(text: string): number | null | undefined {
	const v = text.trim();
	if (v === "") return null;
	return parseDurationInput(v) ?? undefined;
}

export const ESTIMATE_ERROR = (v: string) => `見積もりを時間として読めません: ${v}（例: 30m / 2h / 1d / 1h30m。空にすると消します）`;

/**
 * issue・routine 画面の estimated の欄（ADR-0231 の追記）。メニューを開かず、その場で入力する。
 * Enter か欄を離れたときに保存し、Escape で戻す。読めない値は保存せずに説明を出す
 */
export function EstimateField(props: { value: number | null; onSave: (minutes: number | null) => void }) {
	const text = props.value === null ? "" : formatMinutes(props.value);
	const [draft, setDraft] = useState(text);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => setDraft(text), [text]);
	const commit = () => {
		const minutes = parseEstimate(draft);
		if (minutes === undefined) return setError(ESTIMATE_ERROR(draft));
		setError(null);
		if (minutes !== props.value) props.onSave(minutes);
	};
	return (
		<label class={`vt-effort-cell is-input${error ? " is-error" : ""}`}>
			<span class="vt-field-label">estimated</span>
			<input
				type="text"
				class="vt-effort-input"
				value={draft}
				placeholder="—"
				aria-invalid={error !== null}
				title={error ?? "e.g. 30m / 2h / 1d / 1h30m (1d = 24h). Empty to clear"}
				onInput={(e) => setDraft(e.currentTarget.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.isComposing) e.currentTarget.blur();
					if (e.key === "Escape") {
						setDraft(text);
						setError(null);
					}
				}}
			/>
			{error && <span class="vt-name-error">{error}</span>}
		</label>
	);
}
