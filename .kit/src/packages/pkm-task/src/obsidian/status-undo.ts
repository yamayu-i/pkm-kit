import { setIcon } from "obsidian";
import { UndoBatch, undoMessage } from "../core/undo";

/** トーストを出しておく時間。別の変更があれば数え直す（ADR-0031） */
export const UNDO_TIMEOUT_MS = 5_000;

type Revert = () => Promise<void>;

/**
 * status の変更を取り消すトースト（ADR-0031）。画面の右下に固定で出す。
 * 5 秒で消え、その間に別の変更があれば件数を足して 5 秒から数え直す
 */
export class StatusUndo {
	private readonly batch = new UndoBatch<Revert>();
	private timer: number | null = null;
	private el: HTMLElement | null = null;
	private text: HTMLElement | null = null;

	constructor(
		private readonly report: (message: string, error?: unknown) => void,
		private readonly timeoutMs = UNDO_TIMEOUT_MS,
	) {}

	/** 変更を足す。key は issue / routine の ID（同じものは 1 件に数える） */
	push(key: string, revert: Revert): void {
		const count = this.batch.add(key, revert);
		this.show(count);
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => this.dismiss(), this.timeoutMs);
	}

	/** トーストに入っているすべての変更を、最初に変える前に戻す */
	async undo(): Promise<void> {
		const reverts = this.batch.take();
		this.dismiss();
		for (const revert of reverts) {
			try {
				await revert();
			} catch (e) {
				this.report("元に戻せませんでした", e);
			}
		}
	}

	dismiss(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.batch.clear();
		this.el?.remove();
		this.el = null;
		this.text = null;
	}

	private show(count: number): void {
		if (!this.el) {
			const el = document.createElement("div");
			el.className = "vt-toast";
			el.setAttribute("role", "status");
			el.setAttribute("aria-live", "polite");
			const text = document.createElement("span");
			text.className = "vt-toast-text";
			const button = document.createElement("button");
			button.className = "vt-toast-action";
			button.type = "button";
			button.append("Undo");
			const icon = document.createElement("span");
			icon.className = "vt-icon";
			icon.setAttribute("aria-hidden", "true");
			setIcon(icon, "chevron-right");
			button.append(icon);
			button.addEventListener("click", () => void this.undo());
			el.append(text, button);
			document.body.append(el);
			this.el = el;
			this.text = text;
		}
		this.text!.textContent = undoMessage(count);
	}
}
