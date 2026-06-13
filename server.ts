import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

import { dbService } from "./src/db/index.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';
/**
 * Lazy-load Gemini AI client to prevent crash on startup if GEMINI_API_KEY is missing.
 */
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required in secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Interface for repository data parsed from GitHub API
 */
interface RepoRecord {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  htmlUrl: string;
  size: number;
}

/**
 * Utility to fetch user profile and repo data from the GitHub Public API.
 */
async function fetchGithubProfile(username: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'github-profile-analyzer-api',
  };

  // If a dev token is available, map it to avoid rate limiting
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // Fetch Public Profile metadata
  const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!profileRes.ok) {
    if (profileRes.status === 404) {
      throw new Error(`GitHub username "${username}" not found.`);
    }
    const errorBody = await profileRes.text();
    throw new Error(`GitHub API error (Code ${profileRes.status}): ${errorBody}`);
  }
  const profile = await profileRes.json();

  // Fetch Repositories list (up to 100 recent)
  const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
  let repos: any[] = [];
  if (reposRes.ok) {
    repos = await reposRes.json();
  } else {
    console.error(`Unable to retrieve repos for ${username}:`, await reposRes.text());
  }

  return { profile, repos };
}

/**
 * Computes complex metrics, languages, repository rankings and strength index
 */
function analyzeGithubData(profile: any, repos: any[]) {
  const publicRepos = profile.public_repos || 0;
  const followers = profile.followers || 0;
  const following = profile.following || 0;

  let totalStars = 0;
  let totalForks = 0;
  let totalSize = 0;

  const langBytes: Record<string, number> = {};
  const langCounts: Record<string, number> = {};
  const allReposList: RepoRecord[] = [];

  repos.forEach((repo: any) => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    totalSize += repo.size || 0;

    const lang = repo.language;
    if (lang) {
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      // Use repo size in KB as a proxy weight for code volume
      langBytes[lang] = (langBytes[lang] || 0) + Math.max(1, repo.size || 1);
    }

    allReposList.push({
      name: repo.name || 'Unnamed repo',
      description: repo.description || null,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || null,
      htmlUrl: repo.html_url || '',
      size: repo.size || 0,
    });
  });

  // Sort and select top repositories by stars, falling back to forks
  allReposList.sort((a, b) => b.stars - a.stars || b.forks - a.forks);
  const topRepos = allReposList.slice(0, 5);

  // Compute percentage break of languages
  const totalLanguageBytes = Object.values(langBytes).reduce((a, b) => a + b, 0);
  const languageBreakdown: Record<string, { count: number; bytes: number; percentage: number }> = {};

  Object.keys(langBytes).forEach(lang => {
    const bytes = langBytes[lang];
    languageBreakdown[lang] = {
      count: langCounts[lang],
      bytes: bytes,
      percentage: totalLanguageBytes > 0 ? Math.round((bytes / totalLanguageBytes) * 100 * 10) / 10 : 0
    };
  });

  const avgRepoSize = repos.length > 0 ? Math.round(totalSize / repos.length) : 0;

  // Grade profile efficiency score (max 100)
  const scoreFromFollowers = Math.min(35, followers * 1.5);
  const scoreFromRepos = Math.min(20, publicRepos * 1.0);
  const scoreFromStars = Math.min(35, totalStars * 4);
  const scoreFromForks = Math.min(10, totalForks * 2);
  const profileScore = Math.max(1, Math.round(scoreFromFollowers + scoreFromRepos + scoreFromStars + scoreFromForks));

  // Deduce archetype labels
  let developerStyle = "Technical Explorer";
  if (repos.length > 0) {
    const languagesSortedByCode = Object.keys(languageBreakdown).sort((a, b) => languageBreakdown[b].bytes - languageBreakdown[a].bytes);
    const primaryLanguage = languagesSortedByCode[0] || null;

    if (totalStars > 150) {
      developerStyle = "Distinguished Open-Sourcer";
    } else if (languagesSortedByCode.length >= 6) {
      developerStyle = "Polyglot Pragmatist";
    } else if (primaryLanguage) {
      if (["JavaScript", "TypeScript", "HTML", "CSS"].includes(primaryLanguage)) {
        developerStyle = "Front-End Innovator";
      } else if (["Python", "Go", "Rust", "Java", "C++", "C#"].includes(primaryLanguage)) {
        developerStyle = "Back-End Architect";
      } else if (["Swift", "Kotlin", "Dart"].includes(primaryLanguage)) {
        developerStyle = "Mobile Developer";
      } else {
        developerStyle = `${primaryLanguage} Artisan`;
      }
    }
  }

  return {
    followers,
    following,
    publicRepos,
    totalStars,
    totalForks,
    avgRepoSize,
    profileScore,
    developerStyle,
    topRepos,
    languageBreakdown
  };
}

/**
 * Queries Gemini 3.5 Flash to synthesize intelligent insights out of computed metrics
 */
async function generateAiSummary(username: string, name: string, bio: string, analyzed: ReturnType<typeof analyzeGithubData>) {
  try {
    const ai = getGeminiClient();
    const prompt = `
You are an expert technical recruiter, veteran code auditor, and senior engineering mentor.
Perform a deep analysis on the private portfolio metrics and metadata of GitHub user: "${username}".

Full Name: ${name || "Not Provided"}
Bio: ${bio || "No description written"}

Analyzed Statistics:
- Public Repos Count: ${analyzed.publicRepos}
- Total Followers: ${analyzed.followers}
- Overall Stars: ${analyzed.totalStars}
- Fork Counts: ${analyzed.totalForks}
- Average Size per Repository: ${analyzed.avgRepoSize} KB
- Archetype Code: ${analyzed.developerStyle}
- Profile Score (Weighted Index of stars, forks & followers): ${analyzed.profileScore}/100

Detailed Language Volume breakdown:
${JSON.stringify(analyzed.languageBreakdown, null, 2)}

Top Repositories lists:
${JSON.stringify(analyzed.topRepos, null, 2)}

Generate an authentic, highly detailed, interesting profile review. Craft exactly four sub-sections, using these exact bold markers as headings:

1. **🔍 Technological Archetype**: Detail what their language distributions, sizes, and repo choices reveal about their true code-writing profile, focus, and engineering level. Mention their developer style: "${analyzed.developerStyle}".
2. **💪 Primary Superpowers**: Identify their core strengths, highlight the most impressive aspect of their public repos (be it star density, forks, code variety, consistency, or structure), and celebrate their successes.
3. **🚀 Career Compass**: Recommend matching career pathways, industries, or modern developer roles (e.g., Lead developer, systems builder, UI engineer, data architect) most suited to their computed profile.
4. **💡 Recommended Quest**: Name some concrete next-step technologies, tools, methodologies, or architectural habits they should explore to expand their credentials.

Write this in second-person ("You are a front-end specialist...") or third-person. Be engaging, realistic, professional, and technical. Keep each section substantive (3-4 sentences minimum). Avoid generic fluff.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.75,
      }
    });

    return response.text || "Summary report unavailable.";
  } catch (err) {
    console.warn("Summary synthesis dropped:", err);
    return `Summary report could not be computed: ${(err as Error).message}`;
  }
}

/**
 * Main Full-Stack Server Initiator
 */
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json());

  // Log request utilities
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // API 1: Health State Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API 2: Fetch all stored analyzed profiles
  app.get("/api/profiles", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Query database cleanly through the dynamic Database Service
      const profilesList = await dbService.getProfiles();

      res.json({
        success: true,
        count: profilesList.length,
        profiles: profilesList
      });
    } catch (error) {
      console.error("Database query of profiles failed:", error);
      res.status(500).json({
        error: "Failed to retrieve analyzed profiles. Please try again later.",
        details: (error as Error).message
      });
    }
  });

  // API 3: Fetch detail of a single profiled user
  app.get("/api/profiles/:username", requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbProfile = await dbService.getProfileByUsername(req.params.username);

      if (!dbProfile) {
        return res.status(404).json({
          success: false,
          error: `Profile for user "${req.params.username}" has not been analyzed yet.`
        });
      }

      res.json({
        success: true,
        profile: dbProfile
      });
    } catch (error) {
      console.error(`Database match for username ${req.params.username} failed:`, error);
      res.status(500).json({
        error: "Failed to load profile details.",
        details: (error as Error).message
      });
    }
  });

  // Custom Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required." });
      }
      
      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const dbUser = await dbService.createUser(email, hashedPassword, name);
      
      const token = jwt.sign({ id: dbUser.id, email: dbUser.email, name: dbUser.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.status(200).json({ success: true, token, user: { id: dbUser.id, email: dbUser.email, name: dbUser.name } });
    } catch (error) {
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Registration failed.", details: (error as Error).message });
    }
  });

  // Custom Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const dbUser = await dbService.getUserByEmail(email);
      
      if (!dbUser) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign({ id: dbUser.id, email: dbUser.email, name: dbUser.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.status(200).json({ success: true, token, user: { id: dbUser.id, email: dbUser.email, name: dbUser.name } });
    } catch (error) {
      console.error("Login failed:", error);
      res.status(500).json({ error: "Login failed.", details: (error as Error).message });
    }
  });

  // Custom Me Profile Fetch
  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      res.status(200).json({ success: true, user: authUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile." });
    }
  });

  // API 4: Execute/Perform Analysis on a GitHub Username
  app.post("/api/analyze", requireAuth, async (req: AuthRequest, res) => {
    const { username } = req.body;
    
    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ error: "GitHub Username parameter is required." });
    }

    try {
      const authUser = req.user!;
      
      // 1. Authenticate user from database
      const dbUser = await dbService.getUserByEmail(authUser.email);
      if (!dbUser) throw new Error("Authenticated user not found in database.");
      
      const targetUsername = username.trim();
      console.log(`Starting profiling run for: ${targetUsername} initiated by user: ${dbUser.email}`);

      // 2. Fetch public info from GitHub API
      const { profile: ghProfile, repos: ghRepos } = await fetchGithubProfile(targetUsername);

      // 3. Compute statistics and insight metrics
      const computedInsights = analyzeGithubData(ghProfile, ghRepos);

      // 4. Generate comprehensive developer technical review summary report
      const reportSummary = await generateAiSummary(
        ghProfile.login,
        ghProfile.name,
        ghProfile.bio,
        computedInsights
      );

      // 5. Store / Upsert results in PostgreSQL or MySQL using our Database Service
      const dbProfile = await dbService.upsertProfile(
        ghProfile,
        computedInsights,
        reportSummary,
        dbUser.id
      );

      res.status(200).json({
        success: true,
        message: `Successfully analyzed user "${ghProfile.login}".`,
        profile: dbProfile
      });

    } catch (error) {
      console.error(`Profiling failure for ${username}:`, error);
      res.status(500).json({
        error: "Failed to perform GitHub profile analysis.",
        details: (error as Error).message
      });
    }
  });

  // Serve Frontend / Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Express on strict Port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully synchronized on http://0.0.0.0:${PORT}`);
  });
}

// Kickstart server
startServer().catch(err => {
  console.error("Critical error while starting server:", err);
});
