/**
 * 認証情報（トークン）を送ってよい相手かどうかの判定。
 * - https であること（ループバックへの http は端末の外に出ないので例外的に許可）
 * - ホスト名が設定の「トークンを送るホスト」と一致すること
 */
export class AuthTargetError extends Error {
	constructor(
		readonly url: string,
		readonly reason: "insecure-protocol" | "host-mismatch" | "invalid-url",
	) {
		super(
			reason === "insecure-protocol"
				? `https 以外の接続先には認証情報を送りません: ${safeOrigin(url)}`
				: reason === "host-mismatch"
					? `設定にないホストには認証情報を送りません: ${safeOrigin(url)}`
					: "接続先の URL が不正です",
		);
		this.name = "AuthTargetError";
	}
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** エラーメッセージ用。URL 内の認証情報やパスを含めない */
function safeOrigin(url: string): string {
	try {
		const u = new URL(url);
		return `${u.protocol}//${u.host}`;
	} catch {
		return "(不正な URL)";
	}
}

export function normalizeAuthHost(host: string): string {
	return host.trim().toLowerCase();
}

export function checkAuthTarget(url: string, authHost: string): AuthTargetError | null {
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return new AuthTargetError(url, "invalid-url");
	}
	const hostname = u.hostname.toLowerCase();
	if (u.protocol !== "https:" && !(u.protocol === "http:" && LOOPBACK.has(hostname))) {
		return new AuthTargetError(url, "insecure-protocol");
	}
	if (hostname !== normalizeAuthHost(authHost)) return new AuthTargetError(url, "host-mismatch");
	return null;
}

export function assertAuthTarget(url: string, authHost: string): void {
	const err = checkAuthTarget(url, authHost);
	if (err) throw err;
}
