/** 0070 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, hasUpdates, readJson, UPDATES } from "./common.mjs";

export function check(root) {
	const community = readJson(root, COMMUNITY);
	if (community.error) return [community.error];
	if (!hasUpdates(community.value)) return [`${COMMUNITY}: ${UPDATES} が入っていない`];
	return [];
}
