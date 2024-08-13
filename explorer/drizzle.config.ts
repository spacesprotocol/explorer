import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/lib/schema.ts",
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DB_URL,
    },
    verbose: true,
    strict: true,
});
