import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext(undefined);

const translations = {
  en: {
    "nav.home": "Home",
    "nav.explore": "Explore Projects",
    "nav.talent": "Find Talent",
    "nav.universities": "Universities",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.register": "Register",

    "hero.badge": "University-verified student talent",
    "hero.title": "Turn Your Skills Into Real Income",
    "hero.subtitle":
      "A trusted marketplace where university students showcase verified skills, discover freelance projects, build professional portfolios, and earn money safely.",
    "hero.cta.primary": "Get Started",
    "hero.cta.secondary": "Explore Projects",

    "newsletter.title": "Stay ahead of new opportunities",
    "newsletter.subtitle":
      "Get the latest projects, skill trends, and university partnership updates.",
    "newsletter.placeholder": "Enter your email address",
    "newsletter.button": "Subscribe",
    "newsletter.success": "Subscription successful. Welcome aboard!",
    "newsletter.error": "Something went wrong. Please try again.",
  },

  am: {
    "nav.home": "መነሻ",
    "nav.explore": "ፕሮጀክቶችን ያስሱ",
    "nav.talent": "ተሰጥኦ ያግኙ",
    "nav.universities": "ዩኒቨርሲቲዎች",
    "nav.about": "ስለ እኛ",
    "nav.contact": "አግኙን",
    "nav.login": "ግባ",
    "nav.register": "ተመዝገብ",

    "hero.badge": "በዩኒቨርሲቲ የተረጋገጠ የተማሪ ተሰጥኦ",
    "hero.title": "ክህሎትዎን ወደ ትክክለኛ ገቢ ይለውጡ",
    "hero.subtitle":
      "የተማሪዎች የተረጋገጡ ክህሎቶችን የሚያሳዩበት፣ የፍሪላንስ ፕሮጀክቶችን የሚያገኙበት፣ ፖርትፎሊዮ የሚገነቡበት እና በደህንነት ገቢ የሚያገኙበት መድረክ።",
    "hero.cta.primary": "ይጀምሩ",
    "hero.cta.secondary": "ፕሮጀክቶችን ያስሱ",

    "newsletter.title": "አዳዲስ እድሎችን በፍጥነት ይከታተሉ",
    "newsletter.subtitle":
      "አዳዲስ ፕሮጀክቶችን፣ የክህሎት አዝማሚያዎችን እና የዩኒቨርሲቲ አጋርነት መረጃዎችን ያግኙ።",
    "newsletter.placeholder": "ኢሜይልዎን ያስገቡ",
    "newsletter.button": "ይመዝገቡ",
    "newsletter.success": "ምዝገባው ተሳክቷል። እንኳን ደህና መጡ!",
    "newsletter.error": "ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}