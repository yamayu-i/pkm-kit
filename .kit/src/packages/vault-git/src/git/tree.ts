import git, { type PromiseFsClient } from "isomorphic-git";
import type { ResultEntry, TreeEntry } from "../merge/tree-merge";

interface RepoCtx {
	fs: PromiseFsClient;
	dir: string;
	cache: object;
}

/** コミットのツリーを「パス → blob」の平坦な Map にする */
export async function readTreeMap(ctx: RepoCtx, commitOid: string): Promise<Map<string, TreeEntry>> {
	const map = new Map<string, TreeEntry>();
	const { commit } = await git.readCommit({ ...ctx, oid: commitOid });
	const walk = async (treeOid: string, prefix: string): Promise<void> => {
		const { tree } = await git.readTree({ ...ctx, oid: treeOid });
		for (const e of tree) {
			const path = prefix + e.path;
			if (e.type === "tree") await walk(e.oid, path + "/");
			else map.set(path, { oid: e.oid, mode: e.mode });
		}
	};
	await walk(commit.tree, "");
	return map;
}

interface DirNode {
	files: Map<string, TreeEntry>;
	dirs: Map<string, DirNode>;
}

/** 平坦な Map からツリーオブジェクトを書き、ルートツリーの oid を返す */
export async function writeTreeMap(ctx: RepoCtx, entries: Map<string, ResultEntry>): Promise<string> {
	const root: DirNode = { files: new Map(), dirs: new Map() };
	for (const [path, entry] of entries) {
		const oid = "oid" in entry ? entry.oid : await git.writeBlob({ ...ctx, blob: entry.content });
		const segs = path.split("/");
		const name = segs.pop() as string;
		let node = root;
		for (const seg of segs) {
			let child = node.dirs.get(seg);
			if (!child) {
				child = { files: new Map(), dirs: new Map() };
				node.dirs.set(seg, child);
			}
			node = child;
		}
		node.files.set(name, { oid, mode: entry.mode });
	}
	const write = async (node: DirNode): Promise<string> => {
		const tree: Array<{ mode: string; path: string; oid: string; type: "blob" | "tree" | "commit" }> = [];
		for (const [name, e] of node.files) {
			tree.push({ mode: e.mode, path: name, oid: e.oid, type: e.mode === "160000" ? "commit" : "blob" });
		}
		for (const [name, child] of node.dirs) {
			tree.push({ mode: "040000", path: name, oid: await write(child), type: "tree" });
		}
		return git.writeTree({ ...ctx, tree });
	};
	return write(root);
}
