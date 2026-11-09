# ADR-0106: PKM Git の clone は最新の版だけを取る（shallow clone）

- 状態: 提案
- 日付: 2026-11-09

## 背景

[Issue #106](https://github.com/yamayu-i/pkm-kit/issues/106) で扱う。これは同期の再設計（[Issue #86](https://github.com/yamayu-i/pkm-kit/issues/86)）の第 4 段階。

新しい端末で clone すると、全履歴を取る。アセット（画像・PDF・図）の古い版も含まれる。Vault を使い続けるほど最初の clone が重くなる。特にスマホでは、通信量と、メモリに載せる pack の大きさが問題になる。fetch は第 1 段階（[Issue #87](https://github.com/yamayu-i/pkm-kit/issues/87)）で差分だけを取るようになったので、重いのは最初の clone だけ。

#86 では、partial clone（`filter=blob:none`）を独立に検証することにしていた。実依存の isomorphic-git 1.44.8 と、git http-backend を相手にしたテストで、次のことを確かめた。

### partial clone は使えない

isomorphic-git には `filter` の指定がない。足りない blob を後から取る仕組み（promisor）もない。足すには、要求の組み立て、足りない blob を読んだときの取得、オフラインのときの扱いを自前で書く必要がある。どれも同期のあらゆる箇所（マージ、snapshot、復旧）に関わる。

### shallow clone（`depth`）は使える

isomorphic-git の `clone` は `depth` を受け付ける。

転送量を測った。64 KiB のアセットを 16 版持つ履歴で、clone の受信は次のとおり。

| clone | 受信 |
|---|---|
| 今（全履歴） | 約 250 KB |
| `depth: 1` | 約 13 KB |

最新の版だけを取るので、Vault の大きさは今の内容の大きさで決まり、履歴の長さによらない。

`depth: 1` で clone した端末（以下、shallow の端末）で、今の同期を確かめた。どれも今と同じく動いた。

| 場面 | 結果 |
|---|---|
| 編集して同期（snapshot と push） | 共有済みになる |
| ほかの端末が送った版を受け取る（fast-forward） | 取り込める |
| 両側で編集してマージ | マージできる。同じ行ならマーカー |
| 長くオフラインだった端末が、clone より前の版を土台にしたコミットを送り、それを受け取る | 取り込める |
| 同上で、shallow の端末にも送っていないコミットがある | マージできる |
| リモートの履歴が書き換えられ、共通祖先が clone より前（手元にない）になる | 共通祖先は「なし」になり、エラーにならない。空の祖先でマージし、両側を残す（[ADR-0103](0103-git-conflict-records.md) の 4。同期の記録に `no-merge-base`） |

shallow の端末のコミットは、どれも clone の版より後にある。だから、ふつうの使い方では共通祖先は手元にある。手元にないのは、リモートの履歴を書き換えたときだけになる。

## 決定

### 1. clone は `depth: 1` で行う

- `Clone the remote into this vault (first time only)` は、最新の版だけを取る
- その後の fetch は今と同じく差分を取る。手元の履歴は、clone の版から先だけが増えていく
- 設定は足さない。全履歴が要る人は、PC の Git CLI で clone する（今と同じ）か、`git fetch --unshallow` を使う

### 2. partial clone は採らない

- isomorphic-git が対応するまで、または自前で実装する理由が出るまで、採らない
- 第 5 段階の履歴ビューで、clone より前の版を見たい場合が出る。そのときは、必要な分だけ履歴を取り足す方法（`fetch` の `depth` と `relative`）を、その段階の ADR で決める

### 3. 手元にない履歴で失敗しない

- 共通祖先が手元にないときは「なし」として扱う。ADR-0103 の 4 のとおり、空の祖先でマージする。内容は捨てず、両側を残す
- 同期の記録の `no-merge-base` は、shallow の端末では「リモートの履歴が書き換えられた」ことを示す

### 4. 既にある端末は変えない

- 既に全履歴を持つ端末は、そのまま使う。移行はない
- 軽くするための作り直し（clone し直し）は勧めない。clone し直す前に未送信の変更を失う危険のほうが大きい

## 理由

- 重いのは最初の clone だけで、その中身の大半は使わない古い版。最新の版だけを取ると、最初の clone の大きさが Vault の今の大きさで決まる
- 同期に要るのは、最新の版と、clone の後に増えた履歴だけ。共通祖先も、ふつうはその中にある
- 手元にない共通祖先は、ADR-0103 の規則で「両側を残す」側に倒れる。データを失う経路が増えない
- 古い版は、全履歴を持つほかの端末とリモート（GitHub）に残る。端末の中の細かな版は、ファイル回復が持つ（[ADR-0089](0089-git-auto-sync.md) の 2）

## 却下した案

- **partial clone を自前で実装する**: 足りない blob を読む箇所がすべて、オフラインで失敗しうる。同期の「失敗しない」順（ADR-0089 の 7）を、あらゆる読み込みで保つ必要がある。shallow で十分に軽くなる
- **`since`（日付）で clone する**: 「直近 N 日」は、編集の少ない Vault では 1 版も残らないことがある。`depth: 1` と比べて得るものが小さい
- **設定で選べるようにする**: 使う人に Git の履歴の深さを決めさせることになる。全履歴が要るのは PC で Git CLI を使う人で、その人は CLI で取れる

## 影響

- `src/git/engine.ts` の `clone()` に `depth: 1` を足す。`src/git/` を変えるので、セキュリティチェックの対象（転送するものが減るだけで、送る先と認証は変わらない）
- shallow の端末では、PC の Git CLI の `git log` に clone より前の履歴が出ない
- shallow の端末にある `.git/shallow` は、isomorphic-git と Git CLI が読む。PKM Git は直接は扱わない
- `.kit/changes/` に書く（新しく clone した端末は最新の版だけを持つこと）
- 文書: `plugin-development.md` の clone の節、プロダクトの [PKM Git](../../../harness/docs/product/surfaces/git-sync.md)
- 受入テスト（本物の git http-backend を相手にする）:
  - clone の受信が、全履歴より小さい
  - shallow の端末で、push・fast-forward・マージができる
  - 長くオフラインだった端末の古い版を土台にしたコミットを受け取れる
  - 履歴が書き換えられたリモートと、共通祖先なしでマージし、両側を残す
- 新しい依存はない
