import React, { useState } from 'react';
import { Github, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginStart?: () => void;
  onLoginError?: (error: string) => void;
}

export default function LoginScreen({ onLoginStart, onLoginError }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !name) return;
    
    setLoading(true);
    if (onLoginStart) onLoginStart();
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp ? { email, password, name } : { email, password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response from server:", text);
        throw new Error(`Server returned an invalid response (Status ${response.status}). Please completely STOP and RESTART your terminal backend server using 'npm run dev', and make sure your SQL table was updated!`);
      }
      
      if (!response.ok) {
        throw new Error(data?.error || "Authentication failed");
      }
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      // Trigger global refresh so App.tsx can pick up the token
      window.dispatchEvent(new Event('auth-state-change'));
      
    } catch (err: any) {
      console.error("Custom Auth error:", err);
      if (onLoginError) {
        onLoginError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* LEFT SIDE: Beautiful Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-r border-slate-800 items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg space-y-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
            <Github className="h-8 w-8" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Analyze GitHub <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Identities.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md font-medium">
              Unlock developer personalities, decode coding archetypes, and synchronize deep analytics securely to your SQL database.
            </p>
          </div>

          <div className="space-y-5 pt-8 border-t border-slate-800/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Deep AI Synthesis</h4>
                <p className="text-slate-500 text-xs mt-0.5">Automated insights powered by Gemini 3.5 Flash.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Enterprise Security</h4>
                <p className="text-slate-500 text-xs mt-0.5">End-to-end Firebase encryption and JWT validation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative z-10 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
              <Github className="h-6 w-6" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">GitHub Intel</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {isSignUp 
                ? 'Sign up to start profiling developers and syncing data.' 
                : 'Enter your credentials to access the intelligence dashboard.'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5 mt-10">
            
            {/* Conditional Name Field for Sign Up */}
            <div className={`transition-all duration-300 overflow-hidden ${isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
              <label className="block text-xs font-bold tracking-wide text-slate-600 uppercase mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`
                    block w-full pl-11 pr-4 py-3 border-2 border-slate-200 
                    rounded-2xl bg-white text-sm text-slate-900 font-semibold 
                    focus:outline-none focus:border-indigo-600 focus:ring-4 
                    focus:ring-indigo-600/10 transition-all 
                    placeholder:text-slate-400 placeholder:font-normal
                  `}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-600 uppercase mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`
                    block w-full pl-11 pr-4 py-3 border-2 border-slate-200 
                    rounded-2xl bg-white text-sm text-slate-900 font-semibold 
                    focus:outline-none focus:border-indigo-600 focus:ring-4 
                    focus:ring-indigo-600/10 transition-all 
                    placeholder:text-slate-400 placeholder:font-normal
                  `}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold tracking-wide text-slate-600 uppercase">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`
                    block w-full pl-11 pr-4 py-3 border-2 border-slate-200 
                    rounded-2xl bg-white text-sm text-slate-900 font-semibold 
                    focus:outline-none focus:border-indigo-600 focus:ring-4 
                    focus:ring-indigo-600/10 transition-all 
                    placeholder:text-slate-400 placeholder:font-normal
                  `}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || (isSignUp && !name)}
              className={`
                group relative w-full flex justify-center items-center gap-2 
                py-3.5 px-4 border border-transparent rounded-2xl text-sm 
                font-bold text-white bg-slate-900 hover:bg-indigo-600 
                focus:outline-none focus:ring-4 focus:ring-indigo-600/20 
                disabled:opacity-50 disabled:hover:bg-slate-900 overflow-hidden 
                transition-all duration-300 cursor-pointer shadow-lg 
                shadow-slate-900/20 mt-8
              `}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-2">
                {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
                {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          {/* Toggle View */}
          <div className="pt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  // Optional: clear fields when toggling
                  setPassword('');
                }}
                className="ml-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
              >
                {isSignUp ? 'Sign in instead' : 'Sign up now'}
              </button>
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
}
