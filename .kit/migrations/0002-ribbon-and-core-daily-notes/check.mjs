/** 0002 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, CORE, DAILY, hasRibbon, isDefaultDaily, RIBBON, readJson } from "./common.mjs";

export function check(root) {
	const problems = [];
	const core = readJson(root, CORE);
	if (core.error) problems.push(core.error);
	else if (core.value?.["daily-notes"] !== false) problems.push(`${CORE}: daily-notes が false になっていない`);
	const community = readJson(root, COMMUNITY);
	if (community.error) problems.push(community.error);
	else if (!hasRibbon(community.value)) problems.push(`${COMMUNITY}: ${RIBBON} が入っていない`);
	const daily = readJson(root, DAILY);
	if (daily.error) problems.push(daily.error);
	else if (daily.exists && isDefaultDaily(daily.value)) problems.push(`${DAILY}: 既定の値だけなのに残っている`);
	return problems;
}
