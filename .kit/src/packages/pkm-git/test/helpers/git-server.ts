import { Buffer } from "node:buffer";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const TEST_TOKEN = "test-token-123";

/**
 * git http-backend を CGI として動かす本物の smart HTTP サーバー。
 * Basic 認証のパスワードが TEST_TOKEN のときだけ通す。
 */
export class GitServer {
	readonly root = mkdtempSync(join(tmpdir(), "pkm-git-server-"));
	private server?: Server;
	url = "";
	/** Authorization ヘッダー付きで届いたリクエストの数 */
	authorizedRequests = 0;

	git(...args: string[]): string {
		return execFileSync("git", args, { cwd: this.root, encoding: "utf8" });
	}

	/** 初期コミット入りの bare リポジトリ remote.git を作る */
	init(files: Record<string, string>): void {
		const seed = join(this.root, "seed");
		const env = { ...process.env, GIT_AUTHOR_NAME: "seed", GIT_AUTHOR_EMAIL: "s@e", GIT_COMMITTER_NAME: "seed", GIT_COMMITTER_EMAIL: "s@e" };
		execFileSync("git", ["init", "-q", "-b", "main", seed]);
		for (const [path, content] of Object.entries(files)) {
			execFileSync("mkdir", ["-p", join(seed, path, "..")]);
			writeFileSync(join(seed, path), content);
		}
		execFileSync("git", ["add", "-A"], { cwd: seed });
		execFileSync("git", ["commit", "-q", "-m", "init"], { cwd: seed, env });
		execFileSync("git", ["clone", "-q", "--bare", seed, join(this.root, "remote.git")]);
		execFileSync("git", ["config", "http.receivepack", "true"], { cwd: join(this.root, "remote.git") });
	}

	remoteLog(): string[] {
		return execFileSync("git", ["log", "--format=%s", "main"], { cwd: join(this.root, "remote.git"), encoding: "utf8" })
			.trim()
			.split("\n");
	}

	remoteFile(path: string): string {
		return execFileSync("git", ["show", `main:${path}`], { cwd: join(this.root, "remote.git"), encoding: "utf8" });
	}

	async start(): Promise<void> {
		this.server = createServer((req, res) => {
			const auth = req.headers.authorization ?? "";
			if (auth) this.authorizedRequests++;
			const password = Buffer.from(auth.replace(/^Basic /, ""), "base64").toString().split(":")[1];
			if (password !== TEST_TOKEN) {
				res.writeHead(401, { "WWW-Authenticate": 'Basic realm="test"' });
				res.end();
				return;
			}
			const url = new URL(req.url ?? "/", "http://localhost");
			const cgi = spawn("git", ["http-backend"], {
				env: {
					...process.env,
					GIT_PROJECT_ROOT: this.root,
					GIT_HTTP_EXPORT_ALL: "1",
					PATH_INFO: url.pathname,
					QUERY_STRING: url.search.slice(1),
					REQUEST_METHOD: req.method,
					CONTENT_TYPE: req.headers["content-type"] ?? "",
					REMOTE_USER: "test",
					REMOTE_ADDR: "127.0.0.1",
				},
			});
			req.pipe(cgi.stdin);
			const chunks: Buffer[] = [];
			cgi.stdout.on("data", (c: Buffer) => chunks.push(c));
			cgi.on("close", () => {
				const out = Buffer.concat(chunks);
				const sep = out.indexOf("\r\n\r\n");
				const head = out.subarray(0, sep).toString();
				const headers: Record<string, string> = {};
				let status = 200;
				for (const line of head.split("\r\n")) {
					const i = line.indexOf(":");
					const k = line.slice(0, i).trim();
					const v = line.slice(i + 1).trim();
					if (k.toLowerCase() === "status") status = Number.parseInt(v, 10);
					else headers[k] = v;
				}
				res.writeHead(status, headers);
				res.end(out.subarray(sep + 4));
			});
		});
		await new Promise<void>((resolve) => this.server?.listen(0, "127.0.0.1", resolve));
		this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/remote.git`;
	}

	async stop(): Promise<void> {
		await new Promise<void>((resolve) => this.server?.close(() => resolve()));
		rmSync(this.root, { recursive: true, force: true });
	}
}
