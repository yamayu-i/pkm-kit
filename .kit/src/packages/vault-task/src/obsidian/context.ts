import type { App } from "obsidian";
import type { TaskStore } from "./store";
import type { TaskWriter } from "./writer";

/** UI の部品に渡すもの */
export interface TaskContext {
	app: App;
	store: TaskStore;
	writer: TaskWriter;
	/** issue を開く。newTab なら新しいタブで */
	openPath(path: string, newTab?: boolean): Promise<void>;
	/** 書き込みの失敗などを知らせる */
	report(message: string, error?: unknown): void;
}
