import { useEffect, useState } from "preact/hooks";
import type { TaskStore } from "../obsidian/store";

/** 索引が作り直されたら再描画する */
export function useStoreVersion(store: TaskStore): number {
	const [version, setVersion] = useState(store.version);
	useEffect(() => store.subscribe(() => setVersion(store.version)), [store]);
	return version;
}

/** 一定間隔で今の時刻を返す（記録中の経過時間、日付の切り替わり） */
export function useNow(intervalMs = 30_000): number {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), intervalMs);
		return () => window.clearInterval(id);
	}, [intervalMs]);
	return now;
}
