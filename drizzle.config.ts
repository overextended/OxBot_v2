import { defineConfig } from "drizzle-kit";
import { env } from "./src/env"

export default defineConfig({
  dialect: "sqlite",
  out: './drizzle',
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: env.DB_FILE_NAME ? `file:${env.DB_FILE_NAME}` : 'file:data.db',
  }
});
