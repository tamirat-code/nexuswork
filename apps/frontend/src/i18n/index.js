import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";
import af from "./locales/af.json";

const supported = ["en", "am", "af"];
const stored = typeof localStorage !== "undefined" ? localStorage.getItem("nw_language") : null;
const browser = typeof navigator !== "undefined" ? navigator.language?.split("-")[0] : null;
const initial = supported.includes(stored) ? stored : supported.includes(browser) ? browser : "en";

i18n.use(initReactI18next).init({ resources: { en: { translation: en }, am: { translation: am }, af: { translation: af } }, lng: initial, fallbackLng: "en", supportedLngs: supported, interpolation: { escapeValue: true }, returnNull: false });
i18n.on("languageChanged", (lng) => { if (typeof localStorage !== "undefined") localStorage.setItem("nw_language", supported.includes(lng) ? lng : "en"); if (typeof document !== "undefined") { document.documentElement.lang = lng; document.documentElement.dir = ["ar", "he", "fa"].includes(lng) ? "rtl" : "ltr"; } });
if (typeof window !== "undefined") window.__nwI18n = i18n;
export { supported };
export default i18n;
