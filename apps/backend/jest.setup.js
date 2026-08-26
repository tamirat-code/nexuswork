import "dotenv/config";

// Never allow the integration suite to use a development database loaded from
// .env. CI still supplies its own test URI; this only protects local runs.
if (process.env.NODE_ENV === "test") {
  const configuredUri = process.env.MONGO_URI || "mongodb://localhost:27017/nexuswork_test";
  const [withoutQuery, query = ""] = configuredUri.split("?");
  const segments = withoutQuery.split("/");
  const databaseName = segments.pop() || "nexuswork";
  if (!databaseName.includes("test")) segments.push("nexuswork_test");
  else segments.push(databaseName);
  process.env.MONGO_URI = `${segments.join("/")}${query ? `?${query}` : ""}`;
}
