/** 0120 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, hasSlide, readJson, SLIDE } from "./common.mjs";

export function check(root) {
	const community = readJson(root, COMMUNITY);
	if (community.error) return [community.error];
	if (!hasSlide(community.value)) return [`${COMMUNITY}: ${SLIDE} が入っていない`];
	return [];
}
