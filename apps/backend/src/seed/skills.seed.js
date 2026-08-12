import Skill from "../modules/skills/skills.model.js";

const SKILLS = [
  // Web Development
  { name: "JavaScript", slug: "javascript", category: "web-development" },
  { name: "TypeScript", slug: "typescript", category: "web-development" },
  { name: "React", slug: "react", category: "web-development" },
  { name: "Node.js", slug: "nodejs", category: "web-development" },
  { name: "Express", slug: "express", category: "web-development" },
  { name: "MongoDB", slug: "mongodb", category: "web-development" },
  { name: "PostgreSQL", slug: "postgresql", category: "web-development" },
  { name: "HTML & CSS", slug: "html-css", category: "web-development" },
  { name: "Next.js", slug: "nextjs", category: "web-development" },
  { name: "REST APIs", slug: "rest-apis", category: "web-development" },
  { name: "GraphQL", slug: "graphql", category: "web-development" },
  { name: "Python", slug: "python", category: "web-development" },
  { name: "Django", slug: "django", category: "web-development" },
  { name: "Laravel", slug: "laravel", category: "web-development" },
  { name: "PHP", slug: "php", category: "web-development" },

  // Mobile Development
  { name: "React Native", slug: "react-native", category: "mobile-development" },
  { name: "Flutter", slug: "flutter", category: "mobile-development" },
  { name: "Swift", slug: "swift", category: "mobile-development" },
  { name: "Kotlin", slug: "kotlin", category: "mobile-development" },
  { name: "Android", slug: "android", category: "mobile-development" },
  { name: "iOS", slug: "ios", category: "mobile-development" },

  // Data Science & ML
  { name: "Machine Learning", slug: "machine-learning", category: "data-science-ml" },
  { name: "Data Analysis", slug: "data-analysis", category: "data-science-ml" },
  { name: "Data Visualization", slug: "data-visualization", category: "data-science-ml" },
  { name: "TensorFlow", slug: "tensorflow", category: "data-science-ml" },
  { name: "PyTorch", slug: "pytorch", category: "data-science-ml" },
  { name: "Pandas", slug: "pandas", category: "data-science-ml" },
  { name: "NumPy", slug: "numpy", category: "data-science-ml" },
  { name: "SQL", slug: "sql", category: "data-science-ml" },
  { name: "R", slug: "r", category: "data-science-ml" },

  // Design
  { name: "Figma", slug: "figma", category: "ui-ux-design" },
  { name: "Adobe XD", slug: "adobe-xd", category: "ui-ux-design" },
  { name: "UI Design", slug: "ui-design", category: "ui-ux-design" },
  { name: "UX Research", slug: "ux-research", category: "ui-ux-design" },
  { name: "Wireframing", slug: "wireframing", category: "ui-ux-design" },
  { name: "Prototyping", slug: "prototyping", category: "ui-ux-design" },
  { name: "Photoshop", slug: "photoshop", category: "graphic-design" },
  { name: "Illustrator", slug: "illustrator", category: "graphic-design" },
  { name: "Logo Design", slug: "logo-design", category: "graphic-design" },
  { name: "Branding", slug: "branding", category: "graphic-design" },

  // Writing & Content
  { name: "Copywriting", slug: "copywriting", category: "writing-content" },
  { name: "Technical Writing", slug: "technical-writing", category: "writing-content" },
  { name: "Blog Writing", slug: "blog-writing", category: "writing-content" },
  { name: "Editing", slug: "editing", category: "writing-content" },
  { name: "Proofreading", slug: "proofreading", category: "writing-content" },

  // Marketing & SEO
  { name: "SEO", slug: "seo", category: "marketing-seo" },
  { name: "Google Analytics", slug: "google-analytics", category: "marketing-seo" },
  { name: "Social Media Marketing", slug: "social-media-marketing", category: "marketing-seo" },
  { name: "Email Marketing", slug: "email-marketing", category: "marketing-seo" },
  { name: "Content Strategy", slug: "content-strategy", category: "marketing-seo" },
  { name: "PPC Advertising", slug: "ppc-advertising", category: "marketing-seo" },

  // Research & Analysis
  { name: "Academic Research", slug: "academic-research", category: "research-analysis" },
  { name: "Market Research", slug: "market-research", category: "research-analysis" },
  { name: "Statistical Analysis", slug: "statistical-analysis", category: "research-analysis" },
  { name: "Excel", slug: "excel", category: "research-analysis" },
  { name: "Report Writing", slug: "report-writing", category: "research-analysis" },

  // Engineering & CAD
  { name: "AutoCAD", slug: "autocad", category: "engineering-cad" },
  { name: "SolidWorks", slug: "solidworks", category: "engineering-cad" },
  { name: "3D Modeling", slug: "3d-modeling", category: "engineering-cad" },
  { name: "Mechanical Design", slug: "mechanical-design", category: "engineering-cad" },
  { name: "Circuit Design", slug: "circuit-design", category: "engineering-cad" },

  // Video & Animation
  { name: "Video Editing", slug: "video-editing", category: "video-animation" },
  { name: "Motion Graphics", slug: "motion-graphics", category: "video-animation" },
  { name: "After Effects", slug: "after-effects", category: "video-animation" },
  { name: "Premiere Pro", slug: "premiere-pro", category: "video-animation" },
  { name: "2D Animation", slug: "2d-animation", category: "video-animation" },
  { name: "3D Animation", slug: "3d-animation", category: "video-animation" },

  // Translation & Languages
  { name: "Amharic Translation", slug: "amharic-translation", category: "translation-languages" },
  { name: "English Translation", slug: "english-translation", category: "translation-languages" },
  { name: "Arabic Translation", slug: "arabic-translation", category: "translation-languages" },
  { name: "French Translation", slug: "french-translation", category: "translation-languages" },
  { name: "Localization", slug: "localization", category: "translation-languages" },
];

export async function seedSkills() {
  const count = await Skill.countDocuments();
  if (count > 0) {
    console.log("Skills already seeded, skipping");
    return;
  }
  await Skill.insertMany(SKILLS);
  console.log(`Seeded ${SKILLS.length} skills`);
}