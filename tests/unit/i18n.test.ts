import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { hinglish } from "@/lib/i18n/hinglish";
import { LOCALES, getLocale, isUiLanguage, translate, uiLanguageFor } from "@/lib/i18n/locales";

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

  it("has every English key in Hinglish, with the same {placeholders}, and nothing extra", () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(hinglish).sort()).toEqual(enKeys);
    for (const key of enKeys) {
      const k = key as keyof typeof en;
      expect(hinglish[k].trim(), key).not.toBe("");
      expect(placeholders(hinglish[k]), key).toEqual(placeholders(en[k]));
    }
  });

  it("writes Hinglish in Latin letters only, never Devanagari, and not just English", () => {
    for (const [key, text] of Object.entries(hinglish)) expect(text, key).not.toMatch(/[ऀ-ॿ]/);
    expect(hinglish["home.ask"]).toMatch(/^[\p{Script=Latin}\s]+$/u);
    expect(hinglish["home.ask"]).not.toBe(en["home.ask"]);
    expect(hinglish["steps.next"]).toBe("Maine kar liya");
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
        ["hinglish", "Hinglish"],
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
    expect(isUiLanguage("hinglish")).toBe(true);
  });

  it("speaks and listens to Hinglish as Indian English, but answers in Hindi written in Latin letters", () => {
    const locale = getLocale("hinglish");
    expect(locale).toMatchObject({ speechCode: "en-IN", answerCode: "hi-Latn", htmlLang: "hi-Latn", otherLanguage: "en" });
    expect(uiLanguageFor("hi-Latn")).toBe("hinglish");
    expect(uiLanguageFor("hi-IN")).toBe("hi");
    expect(uiLanguageFor("en-GB")).toBe("en");
    expect(translate("hinglish", "steps.progress", { step: 2, total: 5 })).toBe("5 mein se step 2");
  });
});
