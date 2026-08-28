// Compatibility bridge for legacy screens that still contain literal labels.
// New UI should always use react-i18next keys; this keeps older screens usable
// while they are migrated incrementally.
const dictionary = {
  am: { Dashboard: "ዳሽቦርድ", Notifications: "ማሳወቂያዎች", Messages: "መልዕክቶች", Projects: "ፕሮጀክቶች", Contracts: "ውሎች", Meetings: "ስብሰባዎች", Settings: "ቅንብሮች", Profile: "መገለጫ", Save: "አስቀምጥ", Cancel: "ሰርዝ", "Loading…": "በመጫን ላይ…", "No data yet.": "እስካሁን ምንም መረጃ የለም።", "No results found.": "ውጤት አልተገኘም።", Search: "ፈልግ", "Join meeting": "ስብሰባውን ተቀላቀል", "Leave meeting": "ስብሰባውን ልቀቅ", "End meeting": "ስብሰባውን ዝጋ" },
  af: { Dashboard: "Daashboordii", Notifications: "Beeksisa", Messages: "Ergaawwan", Projects: "Pirojektoota", Contracts: "Waliigalteewwan", Meetings: "Walga'ii", Settings: "Qindaa'ina", Profile: "Profaayila", Save: "Olkaa’i", Cancel: "Haqi", "Loading…": "Fe’amaa jira…", "No data yet.": "Ammas daataan hin jiru.", "No results found.": "Bu’aan hin argamne." }
};

export function translateLegacyDom(language) {
  if (typeof document === "undefined") return;
  const map = dictionary[language];
  if (!map) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => { const value = node.nodeValue.trim(); if (map[value]) node.nodeValue = node.nodeValue.replace(value, map[value]); });
  document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach((element) => { if (map[element.placeholder]) element.placeholder = map[element.placeholder]; });
}
