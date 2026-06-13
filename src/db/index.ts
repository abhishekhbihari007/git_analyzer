import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.ts';
import { eq, desc, sql } from 'drizzle-orm';

// MySQL Server Configuration
const host = process.env.SQL_HOST || '127.0.0.1';
const port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 3306;
const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'root';
const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '';
const database = process.env.SQL_DB_NAME || 'github_analyzer';

console.log(`[DB Initialization] Powering GitHub Analyzer with MySQL: ${host}:${port}/${database}`);

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(pool, { mode: 'default', schema });

/**
 * Standard Unified Interface for Database Operations using MySQL.
 */
export const dbService = {
  getDialect: () => 'mysql',

  /**
   * Creates a new user in the database.
   */
  async createUser(email: string, passwordHash: string, name: string) {
    const [result] = await db.insert(schema.users)
      .values({ email, password: passwordHash, name });
      
    const insertId = (result as any).insertId;
    
    // Fetch the inserted user
    const results = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, insertId))
      .limit(1);
    return results[0];
  },

  /**
   * Fetches a user by email
   */
  async getUserByEmail(email: string) {
    const results = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return results[0] || null;
  },


  /**
   * Fetches lists of analyzed profiles ordered by computed strength score
   */
  async getProfiles() {
    return await db.select()
      .from(schema.analyzedProfiles)
      .orderBy(desc(schema.analyzedProfiles.profileScore))
      .limit(100);
  },

  /**
   * Loads specific analysis summary matching a lowercase username string.
   */
  async getProfileByUsername(username: string) {
    const cleanUsername = username.trim().toLowerCase();
    const results = await db.select()
      .from(schema.analyzedProfiles)
      .where(eq(sql`LOWER(${schema.analyzedProfiles.username})`, cleanUsername))
      .limit(1);
    return results[0] || null;
  },

  /**
   * Upserts extensive computed metrics with custom intelligence evaluation summaries
   */
  async upsertProfile(ghProfile: any, computedInsights: any, reportSummary: string, userId: number) {
    const values = {
      username: ghProfile.login,
      name: ghProfile.name || null,
      avatarUrl: ghProfile.avatar_url || null,
      bio: ghProfile.bio || null,
      location: ghProfile.location || null,
      company: ghProfile.company || null,
      blog: ghProfile.blog || null,
      githubUrl: ghProfile.html_url || null,
      followers: computedInsights.followers,
      following: computedInsights.following,
      publicRepos: computedInsights.publicRepos,
      totalStars: computedInsights.totalStars,
      totalForks: computedInsights.totalForks,
      avgRepoSize: computedInsights.avgRepoSize,
      profileScore: computedInsights.profileScore,
      developerStyle: computedInsights.developerStyle,
      topRepos: computedInsights.topRepos,
      languageBreakdown: computedInsights.languageBreakdown,
      aiSummary: reportSummary,
      userId,
      updatedAt: new Date(),
    };

    await db.insert(schema.analyzedProfiles)
      .values({ ...values, createdAt: new Date() })
      .onDuplicateKeyUpdate({
        set: values
      });
      
    // Return the updated profile
    const results = await db.select()
      .from(schema.analyzedProfiles)
      .where(eq(schema.analyzedProfiles.username, ghProfile.login))
      .limit(1);
    return results[0];
  }
};
