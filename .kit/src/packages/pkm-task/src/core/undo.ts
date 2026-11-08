/**
 * 取り消しのトーストに入っている変更（ADR-0031）。同じものを何度変えても 1 件で、最初に変える前の値を残す
 */
export class UndoBatch<T> {
	private readonly items = new Map<string, T>();

	/** 足して、件数を返す。同じ key がすでにあれば、最初のものを残す */
	add(key: string, item: T): number {
		if (!this.items.has(key)) this.items.set(key, item);
		return this.items.size;
	}

	get size(): number {
		return this.items.size;
	}

	/** すべて取り出して空にする（新しい順。戻すときは後の変更から戻す） */
	take(): T[] {
		const out = [...this.items.values()].reverse();
		this.items.clear();
		return out;
	}

	clear(): void {
		this.items.clear();
	}
}

/** トーストの文言 */
export function undoMessage(count: number): string {
	return `${count}件のステータスが変更されました。`;
}
