import { read, remaining, targetFiles } from "./common.mjs";

export function check(root) {
	return targetFiles(root).flatMap((path) =>
		remaining(read(root, path)).map((h) => `${path}: サブ ${h.id} が Calendar の日（${h.scheduled}）と期間（${h.period}）の両方を持っている。どちらか一方を外す（README）`),
	);
}
