import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { LOCALES, getLocale, isUiLanguage, translate } from "@/lib/i18n/locales";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("message catalog", () => {
  it("has every English key in Hindi, with the same {placeholders}, and nothing extra", () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(hi).sort()).toEqual(enKeys);
    for (const key of enKeys) {
      const k = key as keyof typeof en;
      expect(hi[k].trim(), key).not.toBe("");
      expect(placeholders(hi[k]), key).toEqual(placeholders(en[k]));
    }
  });

  it("writes Hindi in Devanagari", () => {
    expect(hi["home.ask"]).toMatch(/[ऀ-ॿ]/);
    expect(hi["settings.open"]).toMatch(/[ऀ-ॿ]/);
  });

  it("registers every locale once, with its own native name and a full catalog", () => {
    const codes = LOCALES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(LOCALES.map((l) => [l.code, l.nativeName])).toEqual(
      expect.arrayContaining([
        ["en", "English"],
        ["hi", "हिन्दी"],
      ]),
    );
    for (const locale of LOCALES) expect(Object.keys(locale.messages).sort()).toEqual(Object.keys(en).sort());
  });
});

describe("translate", () => {
  it("fills in {placeholders}", () => {
    expect(translate("en", "steps.progress", { step: 2, total: 5 })).toBe("Step 2 of 5");
    expect(translate("hi", "steps.progress", { step: 2, total: 5 })).toContain("2");
  });

  it("knows which codes are interface languages", () => {
    expect(isUiLanguage("hi")).toBe(true);
    expect(isUiLanguage("xx")).toBe(false);
    expect(getLocale("hi").speechCode).toBe("hi-IN");
  });
});
