import type { App } from "obsidian";
import type { TaskSettings } from "./settings";
import type { StatusUndo } from "./status-undo";
import type { TaskStore } from "./store";
import type { TaskWriter } from "./writer";

/** UI の部品に渡すもの */
export interface TaskContext {
	app: App;
	store: TaskStore;
	writer: TaskWriter;
	/** status の変更を取り消すトースト（ADR-0031） */
	undo: StatusUndo;
	settings: TaskSettings;
	saveSettings(): Promise<void>;
	/** issue を開く。newTab なら新しいタブで */
	openPath(path: string, newTab?: boolean): Promise<void>;
	/** View を開く（すでに開いていればそれを前に出す） */
	openView(type: string): Promise<void>;
	/** 書き込みの失敗などを知らせる */
	report(message: string, error?: unknown): void;
}
