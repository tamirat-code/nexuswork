import Category from "../modules/categories/categories.model.js";

const CATEGORIES = [
  { name: "Web Development", slug: "web-development", description: "Websites, web apps, and APIs", icon: "🌐", sort_order: 1 },
  { name: "Mobile Development", slug: "mobile-development", description: "iOS, Android, and cross-platform apps", icon: "📱", sort_order: 2 },
  { name: "Data Science & ML", slug: "data-science-ml", description: "Data analysis, machine learning, and AI", icon: "🤖", sort_order: 3 },
  { name: "UI/UX Design", slug: "ui-ux-design", description: "User interface and experience design", icon: "🎨", sort_order: 4 },
  { name: "Graphic Design", slug: "graphic-design", description: "Logos, branding, and visual assets", icon: "🖌️", sort_order: 5 },
  { name: "Writing & Content", slug: "writing-content", description: "Copywriting, editing, and content creation", icon: "✍️", sort_order: 6 },
  { name: "Marketing & SEO", slug: "marketing-seo", description: "Digital marketing, SEO, and growth", icon: "📈", sort_order: 7 },
  { name: "Research & Analysis", slug: "research-analysis", description: "Academic research, market analysis, and reports", icon: "🔬", sort_order: 8 },
  { name: "Engineering & CAD", slug: "engineering-cad", description: "Mechanical, electrical, and CAD work", icon: "⚙️", sort_order: 9 },
  { name: "Video & Animation", slug: "video-animation", description: "Video editing, motion graphics, and animation", icon: "🎬", sort_order: 10 },
  { name: "Translation & Languages", slug: "translation-languages", description: "Translation, localization, and language services", icon: "🌍", sort_order: 11 },
  { name: "Other", slug: "other", description: "Anything else", icon: "📦", sort_order: 99 },
];

export async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) {
    console.log("Categories already seeded, skipping");
    return;
  }
  await Category.insertMany(CATEGORIES);
  console.log(`Seeded ${CATEGORIES.length} categories`);
}