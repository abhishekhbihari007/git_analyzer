import React, { useState, useEffect } from 'react';
import { AnalyzedProfile } from './types.ts';
import LoginScreen from './components/LoginScreen.tsx';
import ProfileDetails from './components/ProfileDetails.tsx';
import ApiDocs from './components/ApiDocs.tsx';
import { 
  Github, LogOut, Search, Sparkles, Database, Code, 
  Layers, Terminal, RefreshCw, Key, HelpCircle, UserCheck, Check, Copy
} from 'lucide-react';

interface CustomUser {
  id: number;
  email: string;
  name: string;
  photoURL?: string;
  displayName?: string;
}

export default function App() {
  // Authentication States
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [idToken, setIdToken] = useState<string>('');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [copyingToken, setCopyingToken] = useState(false);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);

  // View States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'docs'>('dashboard');
  const [selectedProfile, setSelectedProfile] = useState<AnalyzedProfile | null>(null);

  // Profiles State
  const [profiles, setProfiles] = useState<AnalyzedProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Analysis / Perform Run States
  const [usernameInput, setUsernameInput] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Search/Filter states for the list
  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');

  // Check session token
  const checkSession = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setCurrentUser(null);
      setIdToken('');
      setSelectedProfile(null);
      setLoadingAuth(false);
      return;
    }
    
    setLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser({
          ...data.user,
          displayName: data.user.name
        });
        setIdToken(token);
      } else {
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
        setIdToken('');
        setSelectedProfile(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
      setIdToken('');
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkSession();
    window.addEventListener('auth-state-change', checkSession);
    return () => window.removeEventListener('auth-state-change', checkSession);
  }, []);

  // Fetch profiles catalog whenever token is active
  const fetchProfiles = async () => {
    if (!idToken) return;
    setLoadingProfiles(true);
    setProfilesError(null);
    try {
      const response = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfiles(data.profiles || []);
      } else {
        setProfilesError(data.error || 'Failed to load analyzed catalog.');
      }
    } catch (err: any) {
      console.error("Error loading profiles:", err);
      setProfilesError(err.message || 'Error communicating with database.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchProfiles();
    }
  }, [idToken]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth-state-change'));
  };

  // Perform analytical run
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = usernameInput.trim();
    if (!query) return;

    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisStep(1); // Stage 1: Github Connect

    // Stepper timer mock logs for beautiful responsiveness
    const stepIntervals = [
      setTimeout(() => setAnalysisStep(2), 1200), // Stage 2: Code Metrics
      setTimeout(() => setAnalysisStep(3), 2500), // Stage 3: Language percentages
      setTimeout(() => setAnalysisStep(4), 4500), // Stage 4: Profile intelligence
    ];

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ username: query })
      });

      // Clear timers
      stepIntervals.forEach(clearTimeout);

      const data = await response.json();
      if (response.ok && data.success) {
        setUsernameInput('');
        // Refresh catalog list
        await fetchProfiles();
        // Automatically direct view to the newly compiled report
        setSelectedProfile(data.profile);
      } else {
        setAnalysisError(data.error || 'Failed to analyze user. Confirm they have a public profile and active repositories.');
      }
    } catch (err: any) {
      stepIntervals.forEach(clearTimeout);
      console.error("Communication error during profiling run:", err);
      setAnalysisError(err.message || 'Communication breakdown with API.');
    } finally {
      setAnalysisLoading(false);
      setAnalysisStep(0);
    }
  };

  const copyJwtToClipboard = () => {
    navigator.clipboard.writeText(idToken);
    setCopyingToken(true);
    setTimeout(() => setCopyingToken(null), 2000);
  };

  // Filter list
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.name && profile.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.location && profile.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesArchetype = archetypeFilter === '' || 
      (profile.developerStyle && profile.developerStyle.toLowerCase().includes(archetypeFilter.toLowerCase()));

    return matchesSearch && matchesArchetype;
  });

  // Extract unique archetypes for filters
  const uniqueArchetypes = Array.from(new Set(
    profiles.map(p => p.developerStyle).filter(style => style !== null)
  )) as string[];

  // Render gate
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="inline-flex items-center gap-2 text-indigo-600 animate-spin mb-4">
          <RefreshCw className="h-8 w-8" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Synchronizing Secure Tokens...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        onLoginError={(err) => alert(err)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedProfile(null); setActiveTab('dashboard'); }}>
              <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                <Github className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-transparent">
                GitHub Profile Intel
              </span>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden sm:flex space-x-1">
              <button
                onClick={() => { setSelectedProfile(null); setActiveTab('dashboard'); }}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard' && !selectedProfile
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setSelectedProfile(null); setActiveTab('docs'); }}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'docs' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                API Spec & Exports
              </button>
            </nav>

            {/* Profile Bar / Token Copier */}
            <div className="flex items-center gap-3 relative">
              
              {/* User Dropdown for SQL Testing JWT */}
              <div className="relative">
                <button
                  onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`}
                    alt="user avatar"
                    className="h-7 w-7 rounded-full shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden md:inline-block text-xs font-bold text-slate-700 px-1 pr-2">
                    User token
                  </span>
                </button>

                {tokenDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3 z-50 animate-in fade-in-50 slide-in-from-top-1">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{currentUser.displayName || 'Developer'}</p>
                        <p className="text-slate-400 font-mono text-[10px] truncate max-w-[200px]">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Key className="h-3 w-3 text-indigo-500" />
                        Bearer JWT Token
                      </label>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Use this token inside Postman or command line cURLs to pass our API authorization checks.
                      </p>

                      <button
                        onClick={copyJwtToClipboard}
                        className="w-full flex justify-center items-center gap-1.5 text-xs font-semibold py-1.5 px-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                      >
                        {copyingToken ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copyingToken ? 'Copied' : 'Copy JWT token'}
                      </button>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full border border-red-100 hover:bg-red-50 text-red-600 font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Primary Container Wrap */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Tab View routers */}
        {selectedProfile ? (
          <ProfileDetails 
            profile={selectedProfile}
            onBack={() => setSelectedProfile(null)}
          />
        ) : activeTab === 'docs' ? (
          <ApiDocs />
        ) : (
          /* Dashboard Hub View */
          <div className="space-y-8">
            
            {/* Top Row Grid: Search & Quick Pitch */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Search Analyzer Input Form */}
              <div className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Analyze GitHub Profile
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter any public GitHub username. Our pipeline analyzes metrics, counts code size, and compiles comprehensive developer insights.
                  </p>
                </div>

                <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      id="username-analyzer-input"
                      type="text"
                      placeholder="e.g., subhranshuchoudhury"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      disabled={analysisLoading}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm placeholder-slate-400 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                  </div>

                  <button
                    id="trigger-analysis-btn"
                    type="submit"
                    disabled={analysisLoading || !usernameInput.trim()}
                    className="inline-flex justify-center items-center gap-2 px-5 py-3 border border-transparent shadow-xs text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    {analysisLoading ? 'Profiling user...' : 'Analyze User'}
                  </button>
                </form>

                {/* Analysis Errors banner */}
                {analysisError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 leading-relaxed font-medium">
                    {analysisError}
                  </div>
                )}

                {/* Beautiful active analysis progress stepper */}
                {analysisLoading && (
                  <div id="pipeline-stepper" className="border border-indigo-100 bg-indigo-50/30 p-5 rounded-2xl space-y-4 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-800">
                      <span>Analyzing pipeline in progress...</span>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${analysisStep > 1 ? 'bg-indigo-600 text-white' : analysisStep === 1 ? 'bg-indigo-500 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          {analysisStep > 1 ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span>1</span>
                          )}
                        </div>
                        <span className={`font-semibold ${analysisStep >= 1 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                          Connecting to GitHub Public API endpoints...
                        </span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${analysisStep > 2 ? 'bg-indigo-600 text-white' : analysisStep === 2 ? 'bg-indigo-500 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          {analysisStep > 2 ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span>2</span>
                          )}
                        </div>
                        <span className={`font-semibold ${analysisStep >= 2 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                          Pulling and compiling coding metrics...
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${analysisStep > 3 ? 'bg-indigo-600 text-white' : analysisStep === 3 ? 'bg-indigo-500 text-white ring-2 ring-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          {analysisStep > 3 ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span>3</span>
                          )}
                        </div>
                        <span className={`font-semibold ${analysisStep >= 3 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                          Weighing programming language bytes...
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${analysisStep === 4 ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                          <span>4</span>
                        </div>
                        <span className={`font-semibold ${analysisStep >= 4 ? 'text-indigo-800 font-extrabold' : 'text-slate-400'}`}>
                          Synthesizing comprehensive talent evaluation summary...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Section: catalog of analyzed list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Analyzed Developer Catalog
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search and inspect previously evaluated developer profiles.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search bar inside catalog */}
                  <div className="relative flex-1 sm:w-60">
                    <input
                      type="text"
                      placeholder="Filter catalog..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-3 pr-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Archetype Filter dropdown */}
                  <select
                    title="Filter by Tech Style"
                    aria-label="Filter by Tech Style"
                    value={archetypeFilter}
                    onChange={(e) => setArchetypeFilter(e.target.value)}
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="">All Tech Styles</option>
                    {uniqueArchetypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profiles Catalog Grid */}
              {loadingProfiles ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse font-semibold">
                  Accessing Relational Pool Records...
                </div>
              ) : profilesError ? (
                <div className="py-8 text-center text-xs text-red-500 bg-red-50 rounded-xl p-4">
                  {profilesError}
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Layers className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">Your Developer Catalog is empty</p>
                  <p className="text-xs max-w-sm mx-auto">Analyze a brand new username above to kickstart your first Postgres profile analysis!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProfiles.map((profile) => (
                    <div 
                      key={profile.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={profile.avatarUrl || `https://avatars.githubusercontent.com/u/9919?v=4`}
                          alt={profile.username}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-extrabold text-[15px] text-slate-900 truncate">
                            {profile.name || profile.username}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono truncate">@{profile.username}</p>
                          {profile.developerStyle && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                              {profile.developerStyle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Small Quick metrics list */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-dashed border-slate-100 py-3 text-center text-xs font-semibold text-slate-700">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Score</p>
                          <p className="text-[15px] font-black mt-0.5 text-indigo-600">{profile.profileScore}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stars</p>
                          <p className="text-[15px] font-black mt-0.5 text-amber-600">{profile.totalStars}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Repos</p>
                          <p className="text-[15px] font-black mt-0.5 text-indigo-900">{profile.publicRepos}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProfile(profile)}
                        className="w-full text-center text-xs font-bold py-2.5 px-4 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Deep Intelligence Report
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
