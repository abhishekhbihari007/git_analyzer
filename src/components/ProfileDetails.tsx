import React from 'react';
import { AnalyzedProfile, TopRepo } from '../types.ts';
import { 
  Github, Calendar, MapPin, Briefcase, Link2, Users, Star, 
  GitFork, FileCode, Trophy, Award, Terminal, Sparkles, Compass, 
  Lightbulb, ArrowLeft, Layers, Percent
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProfileDetailsProps {
  profile: AnalyzedProfile;
  onBack: () => void;
}

// Colors associated with common programming languages
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#cbd211',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  Rust: '#dea584',
  Go: '#00add8',
  PHP: '#4f5d95',
  Ruby: '#701516',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
  Vue: '#41b883',
  Swift: '#f05138',
  Kotlin: '#F18E33',
  Dart: '#00B4AB',
};

const getDefaultColor = () => '#94a3b8';

export default function ProfileDetails({ profile, onBack }: ProfileDetailsProps) {
  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Prepare language chart data
  const languageData = Object.entries(profile.languageBreakdown || {}).map(([lang, info]) => ({
    name: lang,
    percentage: info.percentage,
    bytes: info.bytes,
    count: info.count,
    color: LANGUAGE_COLORS[lang] || getDefaultColor()
  })).sort((a, b) => b.percentage - a.percentage);

  // Parse AI summary into structured sections
  const parseSummary = (text: string | null) => {
    if (!text) return [];
    
    const sections = [
      { key: "archetype", title: "🔍 Technological Archetype", icon: <Terminal className="h-5 w-5 text-indigo-500" />, content: "" },
      { key: "superpowers", title: "💪 Primary Superpowers", icon: <Sparkles className="h-5 w-5 text-amber-500" />, content: "" },
      { key: "compass", title: "🚀 Career Compass", icon: <Compass className="h-5 w-5 text-emerald-500" />, content: "" },
      { key: "quest", title: "💡 Recommended Quest", icon: <Lightbulb className="h-5 w-5 text-teal-500" />, content: "" }
    ];

    let currentKey = "";
    const lines = text.split("\n");
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.includes("Technological Archetype") || cleanLine.toLowerCase().includes("archetype") || cleanLine.startsWith("1.") || cleanLine.includes("🔍")) {
        currentKey = "archetype";
      } else if (cleanLine.includes("Primary Superpowers") || cleanLine.toLowerCase().includes("superpower") || cleanLine.startsWith("2.") || cleanLine.includes("💪")) {
        currentKey = "superpowers";
      } else if (cleanLine.includes("Career Compass") || cleanLine.toLowerCase().includes("career") || cleanLine.startsWith("3.") || cleanLine.includes("🚀")) {
        currentKey = "compass";
      } else if (cleanLine.includes("Recommended Quest") || cleanLine.toLowerCase().includes("quest") || cleanLine.startsWith("4.") || cleanLine.includes("💡")) {
        currentKey = "quest";
      } else {
        const activeSec = sections.find(s => s.key === currentKey);
        if (activeSec) {
          activeSec.content += line + "\n";
        } else if (cleanLine !== "") {
          // Fallback preamble
          sections[0].content += line + "\n";
        }
      }
    });

    // Strip markers
    sections.forEach(sec => {
      sec.content = sec.content.trim()
        .replace(/^[\s#*:-]+/gi, '')
        .replace(/^(1\.|2\.|3\.|4\.)\s*/gi, '')
        .replace(/^\s*\*\s*/gi, '');
    });

    const totalLength = sections.reduce((acc, s) => acc + s.content.length, 0);
    if (totalLength < 100) {
      return [{ key: "full", title: "🤖 Complete Intelligence Report", icon: <Sparkles className="h-5 w-5 text-indigo-500" />, content: text }];
    }

    return sections.filter(s => s.content.length > 5);
  };

  const parsedReport = parseSummary(profile.aiSummary);

  // Capitalize Username
  const displayUsername = profile.username;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Back navigation Row */}
      <div className="flex items-center justify-between">
        <button
          id="back-list-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <a
          id="github-external-link"
          href={profile.githubUrl || `https://github.com/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <Github className="h-4 w-4" />
          GitHub Profile
        </a>
      </div>

      {/* Main Profile Header Card */}
      <div id="profile-hero" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
        <img
          src={profile.avatarUrl || `https://avatars.githubusercontent.com/u/9919?v=4`}
          alt={displayUsername}
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-slate-100 shadow-xs"
          referrerPolicy="no-referrer"
        />

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {profile.name || displayUsername}
              </h1>
              <span className="inline-flex self-center md:self-auto items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                @{displayUsername}
              </span>
            </div>
            
            {profile.bio && (
              <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.company && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {profile.company}
              </span>
            )}
            {profile.blog && (
              <a 
                href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:text-slate-950 transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" />
                {profile.blog}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Analyzed {formatDate(profile.updatedAt)}
            </span>
          </div>

          {profile.developerStyle && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                <Trophy className="h-3.5 w-3.5 animate-pulse" />
                Archetype: {profile.developerStyle}
              </span>
            </div>
          )}
        </div>

        {/* Big Score Box */}
        <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl p-5 w-32 h-32 md:w-36 md:h-36 shrink-0 shadow-lg">
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Power Score</span>
          <span className="text-4xl md:text-5xl font-black mt-1 tracking-tight">{profile.profileScore}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">out of 100</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div id="stat-repos" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Public Repos</span>
            <FileCode className="h-5 w-5 text-indigo-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-2">{profile.publicRepos}</span>
        </div>

        <div id="stat-followers" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Followers</span>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-2">{profile.followers}</span>
        </div>

        <div id="stat-stars" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Total Stars</span>
            <Star className="h-5 w-5 text-amber-500 fill-amber-300" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-2">{profile.totalStars}</span>
        </div>

        <div id="stat-forks" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Fork Count</span>
            <GitFork className="h-5 w-5 text-pink-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-2">{profile.totalForks}</span>
        </div>

        <div id="stat-size" className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 md:col-span-1 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Avg Size</span>
            <Layers className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-2">
            {profile.avgRepoSize > 1024 
              ? `${(profile.avgRepoSize / 1024).toFixed(1)} MB` 
              : `${profile.avgRepoSize} KB`}
          </span>
        </div>
      </div>

      {/* Two Columns Section: Languages & Repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Languages Breakdown */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Percent className="h-5 w-5 text-slate-700" />
            Language breakdown
          </h2>

          <div className="flex-1 mt-6 flex flex-col gap-5 justify-between">
            {languageData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FileCode className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">No language metrics recorded.</p>
              </div>
            ) : (
              <>
                {/* Visual Chart utilizing Recharts bar */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={languageData.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" style={{ fontSize: '11px', fontWeight: 'bold' }} width={80} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950 text-white rounded-lg p-2.5 text-xs shadow-md border border-slate-800">
                                <p className="font-bold">{data.name}</p>
                                <p className="text-slate-300">Percentage: {data.percentage}%</p>
                                <p className="text-slate-300">Total counted: {data.count} repos</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar dataKey="percentage" radius={4}>
                        {languageData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Progress Indicators List */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  {languageData.slice(0, 6).map((lang) => (
                    <div key={lang.name} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                          {lang.name}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">{lang.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Repositories */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Trophy className="h-5 w-5 text-slate-700" />
            Top rated repositories
          </h2>

          <div className="flex-1 mt-6 space-y-4">
            {!profile.topRepos || profile.topRepos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <Github className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">No repositories analyzed.</p>
              </div>
            ) : (
              profile.topRepos.map((repo) => (
                <div 
                  key={repo.name} 
                  className="p-4 border border-slate-200/80 hover:border-slate-300 rounded-xl hover:bg-slate-50/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <a 
                        href={repo.htmlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[15px] font-bold text-slate-900 hover:text-indigo-600 transition-colors inline-block"
                      >
                        {repo.name}
                      </a>
                      {repo.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-lg leading-relaxed">
                          {repo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium shrink-0 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-300" />
                        {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3.5 w-3.5 text-slate-400" />
                        {repo.forks}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2.5">
                    {repo.language ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || getDefaultColor() }} />
                        {repo.language}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Undefined language</span>
                    )}

                    <span className="text-[10px] font-mono text-slate-400">
                      {(repo.size / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Developer Technical Assessment Report */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Award className="h-6 w-6 text-indigo-600" />
          Technical Assessment Report
        </h2>

        {parsedReport.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl my-6">
            <p className="text-slate-500 text-sm font-medium">No intelligence assessment compiled for this user.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
            {parsedReport.map((sec) => (
              <div 
                key={sec.key || sec.title} 
                className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 md:p-6 transition-colors flex flex-col"
              >
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 mb-3">
                  {sec.icon}
                  {sec.title}
                </h3>
                <div className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
