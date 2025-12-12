import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Helper to parse connection string since drizzle-kit might ignore ssl when url is present
const databaseUrl = process.env.DATABASE_URL!;
const url = new URL(databaseUrl);

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // remove leading slash
    // TiDB requires SSL options that might not match stricter types
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    } as unknown as object,
  },
});
