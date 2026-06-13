import { relations } from 'drizzle-orm';
import { int, mysqlTable, varchar, text, timestamp, json } from 'drizzle-orm/mysql-core';

// ==========================================
// MySQL Database Schema
// ==========================================

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const analyzedProfiles = mysqlTable('analyzed_profiles', {
  id: int('id').autoincrement().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(), // GitHub username
  name: text('name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  location: text('location'),
  company: text('company'),
  blog: text('blog'),
  githubUrl: text('github_url'),
  followers: int('followers').default(0).notNull(),
  following: int('following').default(0).notNull(),
  publicRepos: int('public_repos').default(0).notNull(),
  
  // Custom Analyzed Insights
  totalStars: int('total_stars').default(0).notNull(),
  totalForks: int('total_forks').default(0).notNull(),
  avgRepoSize: int('avg_repo_size').default(0).notNull(), // KB
  profileScore: int('profile_score').default(0).notNull(), // out of 100
  developerStyle: varchar('developer_style', { length: 255 }),
  
  // JSON structures
  topRepos: json('top_repos').$type<Array<{
    name: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    htmlUrl: string;
    size: number;
  }>>(),
  
  languageBreakdown: json('language_breakdown').$type<Record<string, {
    count: number;
    bytes: number;
    percentage: number;
  }>>(),
  
  aiSummary: text('ai_summary'),
  userId: int('user_id')
    .references(() => users.id)
    .notNull(),
    
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// MySQL relationships
export const usersRelations = relations(users, ({ many }) => ({
  analyzedProfiles: many(analyzedProfiles),
}));

export const analyzedProfilesRelations = relations(analyzedProfiles, ({ one }) => ({
  author: one(users, {
    fields: [analyzedProfiles.userId],
    references: [users.id],
  }),
}));
