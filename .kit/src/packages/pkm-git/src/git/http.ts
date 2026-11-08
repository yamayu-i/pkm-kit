import type { GitHttpRequest, GitHttpResponse, HttpClient } from "isomorphic-git";
import { assertAuthTarget } from "./auth-target";

/** Obsidian の requestUrl と同じ形（テストでは fetch で代用する） */
export type RequestFn = (req: {
	url: string;
	method: string;
	headers: Record<string, string>;
	body?: ArrayBuffer;
}) => Promise<{ status: number; headers: Record<string, string>; arrayBuffer: ArrayBuffer }>;

async function collect(body: AsyncIterableIterator<Uint8Array>): Promise<ArrayBuffer> {
	const chunks: Uint8Array[] = [];
	let size = 0;
	for await (const chunk of body) {
		chunks.push(chunk);
		size += chunk.byteLength;
	}
	const out = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out.buffer;
}

async function* once(data: Uint8Array): AsyncIterableIterator<Uint8Array> {
	yield data;
}

/**
 * requestUrl を isomorphic-git の HttpClient にする。
 * モバイルでも CORS の制限を受けないのは requestUrl を経由するため。
 *
 * Authorization ヘッダー付きのリクエストは、送信直前に接続先を検査する。
 * onAuth を通らない経路（.git/config の URL に埋め込まれた認証情報など）もここで止める。
 */
export function createHttpClient(request: RequestFn, authHost: string): HttpClient {
	return {
		async request(req: GitHttpRequest): Promise<GitHttpResponse> {
			const method = req.method ?? "GET";
			const headers = { ...(req.headers as Record<string, string> | undefined) };
			if (Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
				assertAuthTarget(req.url, authHost);
			}
			const body = req.body ? await collect(req.body) : undefined;
			const res = await request({ url: req.url, method, headers, body });
			const resHeaders: Record<string, string> = {};
			for (const [k, v] of Object.entries(res.headers)) resHeaders[k.toLowerCase()] = v;
			return {
				url: req.url,
				method,
				statusCode: res.status,
				statusMessage: String(res.status),
				headers: resHeaders,
				body: once(new Uint8Array(res.arrayBuffer)),
			};
		},
	};
}

/** エラーメッセージなどから認証情報を取り除く */
export function redactSecrets(text: string, secrets: Array<string | null | undefined>): string {
	let out = text.replace(/(https?:\/\/)[^/@\s]+@/g, "$1***@");
	for (const s of secrets) if (s) out = out.split(s).join("***");
	return out;
}
