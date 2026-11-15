import { isOnBoard } from "../core/board";
import { localToday } from "../core/dates";
import { Icon } from "../ui/Icon";
import { toggleOnBoard } from "./board-actions";
import type { TaskContext } from "./context";

/**
 * issue・サブの画面から、今日のボードに載せる（Pick）/ 外す。
 * 今からやるとわかっているものを、Today の Pick で選び直さなくてよいようにする。日付は書かない（ADR-0152）
 * chip: issue 画面のヘッダーの文字つき。なければサブの行の小さいアイコンだけ
 */
export function PickToggle(props: { ctx: TaskContext; keyOf: string; chip?: boolean }) {
	const { ctx } = props;
	const today = localToday();
	const on = isOnBoard(ctx.store.index, today, props.keyOf);
	const title = on ? "On today's board. Click to remove" : "Add to today's board";
	const run = () => void toggleOnBoard(ctx, today, props.keyOf);
	if (props.chip) {
		return (
			<button type="button" class={`vt-field-chip vt-pick${on ? " is-on" : " is-placeholder"}`} aria-pressed={on} title={title} onClick={run}>
				<Icon name="calendar-check" />
				{on ? "On today's board" : "Add to today's board"}
			</button>
		);
	}
	return (
		<button type="button" class={`vt-icon-button vt-pick${on ? " is-on" : ""}`} aria-label={title} aria-pressed={on} title={title} onClick={run}>
			<Icon name="calendar-check" />
		</button>
	);
}
