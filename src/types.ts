export interface TopRepo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  htmlUrl: string;
  size: number;
}

export interface LanguageInfo {
  count: number;
  bytes: number;
  percentage: number;
}

export type LanguageBreakdown = Record<string, LanguageInfo>;

export interface AnalyzedProfile {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  githubUrl: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  
  // Custom Analytics
  totalStars: number;
  totalForks: number;
  avgRepoSize: number;
  profileScore: number;
  developerStyle: string | null;
  
  // Complex items
  topRepos: TopRepo[] | null;
  languageBreakdown: LanguageBreakdown | null;
  aiSummary: string | null;
  
  createdAt: string;
  updatedAt: string;
  userId: number;
}
