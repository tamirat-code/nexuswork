const templates = {
  "web-development": [
    ["source-code", "Source code", "Complete maintainable source code and configuration files"],
    ["deployed-demo", "Live demo", "Working deployment URL or demonstration build"],
    ["documentation", "Documentation", "README with setup, usage, and deployment instructions"],
    ["testing", "Testing evidence", "Test results or verification notes for the completed work"],
  ],
  "mobile-development": [
    ["source-code", "Source code", "Complete mobile application source code"],
    ["build", "Application build", "APK, IPA/TestFlight build, or equivalent distributable"],
    ["documentation", "Documentation", "Installation, configuration, and usage instructions"],
  ],
  "data-science-ml": [
    ["notebook", "Notebook or source code", "Reproducible notebooks and analysis source code"],
    ["dataset", "Dataset", "Cleaned dataset or a documented data access method"],
    ["model", "Model or results", "Trained model, evaluation results, or analysis outputs"],
    ["report", "Analysis report", "Methodology, findings, limitations, and recommendations"],
  ],
  "ui-ux-design": [
    ["design-file", "Design file", "Editable Figma, XD, or equivalent source file"],
    ["prototype", "Interactive prototype", "Clickable prototype demonstrating the intended experience"],
    ["design-spec", "Design specifications", "Components, styles, measurements, and handoff notes"],
  ],
  "graphic-design": [
    ["final-assets", "Final assets", "Approved exports in the required formats and sizes"],
    ["source-files", "Editable source files", "Layered or editable design files"],
    ["brand-guide", "Brand guidelines", "Usage rules, colors, typography, and asset guidance when applicable"],
  ],
  "writing-content": [
    ["final-copy", "Final content", "Completed copy, articles, documentation, or edited material"],
    ["editable-source", "Editable source", "Editable document with tracked changes when applicable"],
    ["content-notes", "Content notes", "Sources, style decisions, and publication guidance"],
  ],
  "marketing-seo": [
    ["strategy", "Strategy or campaign plan", "Goals, audience, channels, budget, and execution plan"],
    ["campaign-assets", "Campaign assets", "Ad copy, creatives, posts, emails, or landing-page content"],
    ["analytics", "Measurement report", "KPIs, results, insights, and recommended next steps"],
  ],
  "research-analysis": [
    ["research-report", "Research report", "Structured findings, methodology, sources, and conclusions"],
    ["data-evidence", "Data and evidence", "Survey data, spreadsheets, analysis files, or source materials"],
    ["presentation", "Presentation", "Executive summary or presentation of the findings"],
  ],
  "engineering-cad": [
    ["technical-drawings", "Technical drawings", "Final drawings, schematics, or engineering documentation"],
    ["source-models", "Source models", "Editable CAD, 3D, simulation, or design source files"],
    ["calculations", "Calculations or validation", "Engineering calculations, simulations, or test results"],
  ],
  "video-animation": [
    ["final-video", "Final video or animation", "Approved export in the required resolution and format"],
    ["source-project", "Source project", "Editable timeline, animation, or project files"],
    ["supporting-assets", "Supporting assets", "Storyboard, subtitles, audio, or graphic assets when applicable"],
  ],
  "translation-languages": [
    ["translated-content", "Translated content", "Complete translated or localized content"],
    ["editable-source", "Editable source", "Editable translation document or localization files"],
    ["quality-notes", "Quality notes", "Glossary, terminology decisions, and QA notes"],
  ],
  other: [
    ["final-deliverable", "Final deliverable", "The completed project output in the agreed format"],
    ["source-materials", "Source or editable materials", "Editable files, source materials, or working files when applicable"],
    ["documentation", "Documentation", "Instructions, handover notes, or verification evidence"],
  ],
};

const CATEGORY_ALIASES = {
  development: "web-development",
  design: "ui-ux-design",
  "data & research": "data-science-ml",
  writing: "writing-content",
  "video & motion": "video-animation",
  marketing: "marketing-seo",
  "web development": "web-development",
  "mobile development": "mobile-development",
  "data science & ml": "data-science-ml",
  "data science and ml": "data-science-ml",
  "ui/ux design": "ui-ux-design",
  "graphic design": "graphic-design",
  "writing & content": "writing-content",
  "marketing & seo": "marketing-seo",
  "research & analysis": "research-analysis",
  "engineering & cad": "engineering-cad",
  "video & animation": "video-animation",
  "translation & languages": "translation-languages",
};

const LEGACY_CATEGORY_LABELS = {
  "web-development": "Development",
  "ui-ux-design": "Design",
  "data-science-ml": "Data & Research",
  "writing-content": "Writing",
  "video-animation": "Video & Motion",
  "marketing-seo": "Marketing",
};

export function normalizeCategory(category) {
  const rawKey = String(category || "other").trim().toLowerCase();
  return CATEGORY_ALIASES[rawKey] || rawKey;
}

export function getCategoryMatchValues(category) {
  const normalized = normalizeCategory(category);
  return [normalized, LEGACY_CATEGORY_LABELS[normalized], ...Object.entries(CATEGORY_ALIASES)
    .filter(([, value]) => value === normalized)
    .map(([alias]) => alias)].filter(Boolean);
}

export function getDeliverableTemplate(category) {
  const key = normalizeCategory(category);
  return (templates[key] || templates.other).map(([keyName, title, description]) => ({
    key: keyName,
    title,
    description,
    required: true,
  }));
}
