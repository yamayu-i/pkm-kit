import { Keymap } from "obsidian";
import { useState } from "preact/hooks";
import { pathForId } from "../core/ids";
import { matchPreset, presetBodyPreview } from "../core/presets";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { linkProps } from "../ui/a11y";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";

/** プリセットを作るフォーム。名前だけを入れ、サブと本文は作ったプリセットの画面で書く（ADR-0186） */
function PresetForm(props: { onSubmit: (name: string) => void }) {
	const [name, setName] = useState("");
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (name.trim()) props.onSubmit(name.trim());
			}}
		>
			<label class="vt-text-field">
				<span>name</span>
				<input type="text" value={name} placeholder="e.g. Release" ref={(el) => el?.focus()} onInput={(e) => setName(e.currentTarget.value)} />
			</label>
			<div class="vt-muted">Add the sub-issues and the body on the preset screen that opens next.</div>
			<div class="vt-form">
				<button type="submit" class="mod-cta" disabled={!name.trim()}>
					Create
				</button>
			</div>
		</form>
	);
}

/** Presets（ADR-0186）: プリセット（preset/ の md）の一覧・検索・作成。行を押すとプリセットの画面を開く */
export function PresetListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const all = ctx.store.index.data.presets;
	const [text, setText] = useState("");
	const presets = all.filter((p) => matchPreset(p, text));
	const create = () =>
		new PreactModal(ctx.app, "Create preset", (close) => (
			<PresetForm
				onSubmit={(name) => {
					close();
					void ctx.writer
						.createPreset(name)
						.then((id) => ctx.openPath(pathForId(id)))
						.catch((e) => ctx.report("プリセットを作れませんでした", e));
				}}
			/>
		)).open();
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Presets</h2>
				<span class="vt-count">{all.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" onClick={create}>
					<Icon name="plus" /> Create preset
				</button>
			</header>
			{all.length > 0 && (
				<section class="vt-card vt-filters">
					<label class="vt-search">
						<Icon name="search" />
						<input type="search" placeholder="Search by name, sub-issue or body" value={text} onInput={(e) => setText(e.currentTarget.value)} />
					</label>
				</section>
			)}
			{all.length === 0 && <div class="vt-empty">No presets yet. A preset is a set of sub-issues and a body that you can add to an issue at once.</div>}
			{all.length > 0 && presets.length === 0 && <div class="vt-empty">No presets match</div>}
			<div class="vt-routine-list">
				{presets.map((p) => {
					const preview = presetBodyPreview(p.body);
					return (
						<div class="vt-routine-item vt-preset-item" key={p.id}>
							<span class="vt-badge vt-id">{p.id}</span>
							<div class="vt-routine-main" {...linkProps((e) => void ctx.openPath(p.path, Keymap.isModEvent(e) !== false))}>
								<span class="vt-routine-summary">{p.name}</span>
								{preview && <span class="vt-preset-item-preview">{preview}</span>}
							</div>
							<span class="vt-muted" title="Number of sub-issues">
								Sub-issues {p.subIssues.length}
							</span>
						</div>
					);
				})}
			</div>
			<p class="vt-muted">Apply a preset from the Sub-issues card of an issue. Its sub-issues are added at the end, and its body is appended to the end of the issue's body.</p>
		</div>
	);
}
