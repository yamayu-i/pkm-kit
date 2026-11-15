import { APP, readApp } from "./common.mjs";

export function check(root) {
	const app = readApp(root);
	if (app.error) return [app.error];
	return app.value?.strictLineBreaks === true ? [`${APP}: strictLineBreaks が true のまま`] : [];
}
