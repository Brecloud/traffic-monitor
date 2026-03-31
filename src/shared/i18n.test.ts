import { describe, expect, it } from "vitest";
import { getDictionaries, t } from "./i18n";

describe("i18n dictionaries", () => {
  it("keeps zh-CN and en-US keys in sync", () => {
    const dict = getDictionaries();
    const zhKeys = Object.keys(dict["zh-CN"]).sort();
    const enKeys = Object.keys(dict["en-US"]).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it("supports template interpolation", () => {
    expect(t("en-US", "notice.exported", { path: "C:/tmp/a.csv" })).toContain("C:/tmp/a.csv");
    expect(t("zh-CN", "notice.exported", { path: "D:/x.csv" })).toContain("D:/x.csv");
  });
});
