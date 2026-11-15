import {it,expect} from "vitest";
import {renderDocuments} from "../cli/render.ts";
it("空の文書集合も読める HTML にする",()=>{expect(renderDocuments([],"",{}, {images:[]})).toContain('lang="ja"')});
