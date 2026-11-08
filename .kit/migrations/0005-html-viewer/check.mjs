/** 0005 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, HTML, readJson } from "./common.mjs";

export function check(root) {
	const community = readJson(root, COMMUNITY);
	if (community.error) return [community.error];
	if (!(Array.isArray(community.value) && community.value.includes(HTML))) return [`${COMMUNITY}: ${HTML} が入っていない`];
	return [];
}
