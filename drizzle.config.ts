import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.SQL_HOST || '127.0.0.1',
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 3306,
    user: process.env.SQL_USER || 'root',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'github_analyzer',
  },
});
