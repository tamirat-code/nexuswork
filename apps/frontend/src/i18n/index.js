import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";
import af from "./locales/af.json";
import { translateLegacyDom } from "./legacy.js";

const supported = ["en", "am", "af"];
const sharedResources = {
  en: { common: { mainNavigation: "Main", openMenu: "Open menu", mobileNavigation: "Mobile", menu: "Menu", theme: "Theme", searchPages: "Search projects, contracts, pages…", noResults: "No results found.", account: "Account" }, auth: { login: "Log in", signup: "Sign up", createAccount: "Create an account" } },
  am: { common: { mainNavigation: "ዋና ምናሌ", openMenu: "ምናሌ ክፈት", mobileNavigation: "የሞባይል ምናሌ", menu: "ምናሌ", theme: "ገጽታ", searchPages: "ፕሮጀክቶችን፣ ውሎችን እና ገጾችን ፈልግ…", noResults: "ውጤት አልተገኘም።", account: "መለያ" }, auth: { login: "ግባ", signup: "ተመዝገብ", createAccount: "መለያ ፍጠር" } },
  af: { common: { mainNavigation: "Mariiwwan ijoo", openMenu: "Marii bani", mobileNavigation: "Marii moobaayilaa", menu: "Marii", theme: "Bifa", searchPages: "Pirojektoota, waliigalteewwan fi fuulawwan barbaadi…", noResults: "Bu’aan hin argamne.", account: "Herrega" }, auth: { login: "Seeni", signup: "Galmaa’i", createAccount: "Herrega uumi" } }
};
const stored = typeof localStorage !== "undefined" ? localStorage.getItem("nw_language") : null;
const browser = typeof navigator !== "undefined" ? navigator.language?.split("-")[0] : null;
const initial = supported.includes(stored) ? stored : supported.includes(browser) ? browser : "en";

i18n.use(initReactI18next).init({ resources: { en: { translation: { ...en, ...sharedResources.en } }, am: { translation: { ...am, ...sharedResources.am } }, af: { translation: { ...af, ...sharedResources.af } } }, lng: initial, fallbackLng: "en", supportedLngs: supported, interpolation: { escapeValue: true }, returnNull: false });
i18n.on("languageChanged", (lng) => { if (typeof localStorage !== "undefined") localStorage.setItem("nw_language", supported.includes(lng) ? lng : "en"); if (typeof document !== "undefined") { document.documentElement.lang = lng; document.documentElement.dir = ["ar", "he", "fa"].includes(lng) ? "rtl" : "ltr"; translateLegacyDom(lng); } });
if (typeof document !== "undefined") { const observer = new MutationObserver(() => translateLegacyDom(i18n.language)); observer.observe(document.documentElement, { childList: true, subtree: true }); }
if (typeof window !== "undefined") window.__nwI18n = i18n;
export { supported };
export default i18n;
