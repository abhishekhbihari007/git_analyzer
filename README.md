# 📊 GitHub Profile Analyzer API - Node.js + Express + MySQL

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-emerald)](https://nodejs.org)
[![Express Version](https://img.shields.io/badge/Express-4.x-indigo)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/Database-MySQL-blue)](https://www.mysql.com/)
[![ORM](https://img.shields.io/badge/ORM-Drizzle-orange)](https://orm.drizzle.team)
[![AI Engine](https://img.shields.io/badge/AI%20Summary-Gemini%20Flash-crimson)](https://ai.google.dev/)

A highly polished, production-ready Fullstack Node.js & Express application that executes deep performance analytics on public GitHub profiles. It computes key statistics (accumulated stars, total forks, language-wise byte percentage maps, and efficiency indicators) and leverages Gemini AI to synthesize a diagnostic technical strength report before persisting users and results in a MySQL relational database.

---

## 🎯 Assignment Checklist Alignment

All requested features are fully developed, thoroughly tested, and integrated:

- [x] **GitHub Public API integration:** Fetches user profiles dynamically. Handles custom language byte maps across repositories.
- [x] **Extended Analytics Engine:** Analyzes public repos to calculate aggregate metrics, total stars, forks, and codebase sizes. Normalizes custom **Profile Score (0-100)** metrics representing developer efficiency.
- [x] **Relational Schema Storage:** Fully mapped relations for `users` and `analyzed_profiles` supporting automatic database upserts using MySQL.
- [x] **Profile List Query API:** Exposed `/api/profiles` endpoint (sorted desc by profile score).
- [x] **Single Profile Query API:** Exposed `/api/profiles/:username` with case-insensitive canonical matches.
- [x] **Visual Testing Hub & Playground:** Beautiful spec-documentation page inside the Web app to execute copyable cURLs, download native SQL DDL schemas, and download a ready-to-test **Postman Collection**.

---

## 🏛️ System Architecture

```
           ┌──────────────────────────────────────────────┐
           │          Integrated Web Dashboard            │
           │    (Tailwind, Recharts Data Analytics)       │
           └──────────────────────┬───────────────────────┘
                                  │ JSON REST Hooks
                                  ▼
           ┌──────────────────────────────────────────────┐
           │         Node.js + Express API Server         │
           │        (Middlewares, Request Routing)        │
           └──────────────────────┬───────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌────────────────────┐           ┌────────────────────┐
       │   GitHub REST API  │           │   Gemini AI API    │
       │ (Stats & Language) │           │ (Summary Synthesis)│
       └────────────────────┘           └────────────────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │      Type-Safe Drizzle ORM Database Layer     │
           │              (MySQL native adapter)           │
           └──────────────────────┬───────────────────────┘
                                  │
                                  ▼
                       ┌────────────────────┐
                       │    MySQL Engine    │
                       └────────────────────┘
```

---

## 🚦 Secure REST Endpoints Spec

Authentication is handled via Firebase client-side secure tokens passed in standard Authorization headers: `Authorization: Bearer <ID_TOKEN>`.

### 1. `GET /api/profiles`
*   **Description:** Fetch all resolved profiles ordered by computed technical score (highest first).
*   **Header Required:** `Authorization: Bearer <TOKEN>`
*   **Output Sample:**
    ```json
    {
      "success": true,
      "profiles": [
        {
          "id": 1,
          "username": "subhranshuchoudhury",
          "name": "Subhranshu Choudhury",
          "followers": 128,
          "profileScore": 88,
          "developerStyle": "Polyglot Generalist",
          "totalStars": 34,
          "languageBreakdown": { "TypeScript": { "percentage": 78 } }
        }
      ]
    }
    ```

### 2. `GET /api/profiles/:username`
*   **Description:** Pull full data analytics payload for a specific developer username.
*   **Header Required:** `Authorization: Bearer <TOKEN>`
*   **Response:** Direct details of matched profile.

### 3. `POST /api/analyze`
*   **Description:** Download and parse repo data, generate AI report summaries, and save details in the relational database.
*   **Payload:** `{"username": "subhranshuchoudhury"}`
*   **Header Required:** `Authorization: Bearer <TOKEN>`

---

## 💾 Relational Database Schema (MySQL Version)

Below is the native schema DDL applied during execution:

```sql
-- Table structure for "users"
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(255) NOT NULL UNIQUE, -- Firebase Auth UID mapping
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table structure for "analyzed_profiles"
CREATE TABLE IF NOT EXISTS analyzed_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  company TEXT,
  blog TEXT,
  github_url TEXT,
  followers INT DEFAULT 0 NOT NULL,
  following INT DEFAULT 0 NOT NULL,
  public_repos INT DEFAULT 0 NOT NULL,
  total_stars INT DEFAULT 0 NOT NULL,
  total_forks INT DEFAULT 0 NOT NULL,
  avg_repo_size INT DEFAULT 0 NOT NULL,
  profile_score INT DEFAULT 0 NOT NULL,
  developer_style VARCHAR(255),
  top_repos JSON,
  language_breakdown JSON,
  ai_summary TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes to maximize search and query speeds
CREATE INDEX idx_profiles_username ON analyzed_profiles (username);
CREATE INDEX idx_profiles_score ON analyzed_profiles (profile_score DESC);
CREATE INDEX idx_users_uid ON users (uid);
```

---

## 🚀 Native Local Setup

Deploy this package locally in **under 5 minutes**:

### 1. Clone & Install Packages
```bash
# Install core bundlers and dependencies
npm install
```

### 2. Prepare Environment Credentials (`.env`)
Create a `.env` file in the project root:
```env
# Credentials for content evaluation API (Gemini SDK)
GEMINI_API_KEY="AIzaSyYourKeyHere..."

# Database Configuration (Point to your local MySQL instance)
SQL_HOST="127.0.0.1"
SQL_PORT=3306
SQL_USER="root"
SQL_PASSWORD=""
SQL_DB_NAME="github_analyzer"
```

### 3. Load DB Schema
You can initialize your database schemas in two easy ways:

*   **Option A (Automated):** Push definitions dynamically using Drizzle CLI:
    ```bash
    npx drizzle-kit push
    ```
*   **Option B (Pure SQL script):** Copy the compiled Script directly from your web spec panel or copy the code block listed in the section above and run it in any MySQL client.

### 4. Run Development Server
Startup the Express fullstack with connected client interface proxy:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### 5. Build for Production Compilation
```bash
npm run build
npm start
```

---

## 🧪 Testing with Postman & Spec Tab Exports

To guarantee a hassle-free evaluation:
1. Log in to the application's dev preview.
2. Navigate to the **API Specs & Exports** tab on the navigation bar.
3. Access ready-to-download scripts:
   - **Postman Collection:** Ready to import directly into your Postman Workspace (includes headers and preconfigured payloads).
   - **MySQL Script:** Symmetrical DDL script.
