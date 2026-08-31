import test from "node:test";
import assert from "node:assert/strict";
import en from "../src/i18n/locales/en.json" with { type: "json" };
import am from "../src/i18n/locales/am.json" with { type: "json" };
import af from "../src/i18n/locales/af.json" with { type: "json" };

function flatten(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" ? flatten(child, path) : [path];
  });
}

test("all supported locales contain the English translation keys", () => {
  const englishKeys = flatten(en).sort();
  for (const [language, locale] of Object.entries({ am, af })) {
    assert.deepEqual(flatten(locale).sort(), englishKeys, `${language} locale keys differ from English`);
  }
});
