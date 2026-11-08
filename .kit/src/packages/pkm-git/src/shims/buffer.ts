// モバイル（Capacitor）には Node の Buffer がないため、isomorphic-git が参照する Buffer をポリフィルに差し替える
export { Buffer } from "buffer";
