import React, { useState } from 'react';
import { Feather, LogIn, UserPlus, Sparkles, BookOpen, Layers, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import type { User } from 'firebase/auth';

interface LandingPageProps {
  onEmailSignIn: (email: string, pass: string) => Promise<User>;
  onEmailRegister: (email: string, pass: string) => Promise<User>;
  onContinueAsGuest: () => void;
  isFirebaseConfigured: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEmailSignIn,
  onEmailRegister,
  onContinueAsGuest,
  isFirebaseConfigured,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authMode === 'login') {
        await onEmailSignIn(email, password);
      } else {
        await onEmailRegister(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Feather className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold tracking-widest text-zinc-900 dark:text-white">
            ENREDA
          </span>
        </div>

        <button
          onClick={onContinueAsGuest}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>Open Studio Canvas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-6xl w-full mx-auto px-6 py-12 gap-12">
        {/* Left Column: Product Value Proposition */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>The Modern Hierarchical Manuscript Studio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Weave your plot threads into a masterpiece.
          </h1>

          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Enreda is a distraction-free writing studio designed for novelists, screenwriters, and storytellers. Connect macro story arcs directly with micro chapter drafting.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-start gap-3 shadow-2xs">
              <Layers className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Top-Down Outline Parser</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Convert Markdown plot outlines into chapter cards instantly.</div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-start gap-3 shadow-2xs">
              <BookOpen className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Children's Books & Covers</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Include story covers and per-chapter illustration banners.</div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-start gap-3 shadow-2xs">
              <Download className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Universal Export</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Export clean manuscripts in Markdown, DOCX, and PDF formats.</div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-start gap-3 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Cloud Sync & Local-First</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Sync across all your devices or write completely offline.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In / Register Card */}
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <button
              onClick={() => setAuthMode('login')}
              className={`text-sm font-bold pb-2 transition-all ${
                authMode === 'login'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`text-sm font-bold pb-2 transition-all ${
                authMode === 'register'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@example.com"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{authMode === 'login' ? 'Sign In to Studio' : 'Create Free Account'}</span>
            </button>
          </form>

          {/* Guest / Direct Entry Option */}
          <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800/80 mt-5 text-center">
            <button
              onClick={onContinueAsGuest}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium hover:underline transition-colors"
            >
              Skip for now • Start writing in offline guest mode →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
