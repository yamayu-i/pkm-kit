import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VaultGit } from "../../src/git/engine";
import { createHttpClient, type RequestFn } from "../../src/git/http";
import { NodeFileStore } from "./node-store";
import { TEST_TOKEN } from "./git-server";

/** Obsidian の requestUrl の代わりに fetch を使う（HTTP アダプタも一緒に検証する） */
const fetchRequest: RequestFn = async ({ url, method, headers, body }) => {
	const res = await fetch(url, { method, headers, body });
	const out: Record<string, string> = {};
	res.headers.forEach((v, k) => {
		out[k] = v;
	});
	return { status: res.status, headers: out, arrayBuffer: await res.arrayBuffer() };
};

export interface Device {
	name: string;
	store: NodeFileStore;
	git: VaultGit;
	write(path: string, text: string): Promise<void>;
	read(path: string): Promise<string>;
	exists(path: string): Promise<boolean>;
	cleanup(): void;
}

export function createDevice(name: string, token: string | null = TEST_TOKEN): Device {
	const root = mkdtempSync(join(tmpdir(), `vault-git-${name}-`));
	const store = new NodeFileStore(root);
	const git = new VaultGit({
		store,
		http: createHttpClient(fetchRequest),
		deviceName: name,
		author: { name, email: `${name}@example.com` },
		getAuth: () => (token ? { username: "x-access-token", password: token } : null),
		now: () => new Date(2026, 9, 31, 12, 0),
	});
	return {
		name,
		store,
		git,
		write: (path, text) => store.write(path, new TextEncoder().encode(text)),
		read: async (path) => new TextDecoder().decode(await store.read(path)),
		exists: async (path) => (await store.stat(path)) !== null,
		cleanup: () => rmSync(root, { recursive: true, force: true }),
	};
}
