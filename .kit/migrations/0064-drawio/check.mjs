/** 0064 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, DRAWIO, hasDrawio, readJson } from "./common.mjs";

export function check(root) {
	const community = readJson(root, COMMUNITY);
	if (community.error) return [community.error];
	if (!hasDrawio(community.value)) return [`${COMMUNITY}: ${DRAWIO} が入っていない`];
	return [];
}
