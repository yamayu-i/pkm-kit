import { useEffect, useState } from "preact/hooks";
import type { TaskStore } from "../obsidian/store";

/** 索引が作り直されたら再描画する */
export function useStoreVersion(store: TaskStore): number {
	const [version, setVersion] = useState(store.version);
	useEffect(() => store.subscribe(() => setVersion(store.version)), [store]);
	return version;
}
