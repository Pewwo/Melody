import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Cloud, 
  HardDrive 
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authService, isSupabaseConfigured } from '../services/supabaseClient';

interface GoogleJwtPayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; username: string; avatarUrl?: string } | null;
  onLogin: (email: string, username?: string, avatarUrl?: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        const { user, error } = await authService.signIn(email, password);
        const metaUsername = (user as any)?.user_metadata?.username || (user as any)?.username || email.split('@')[0];
        onLogin(email, metaUsername);
        onClose();
      } else if (tab === 'signup') {
        const { user, error } = await authService.signUp(email, password, username);
        if (error) throw error;
        setSuccessMsg('Account created successfully! You are now signed in.');
        onLogin(email, username || email.split('@')[0]);
        setTimeout(() => onClose(), 1200);
      } else if (tab === 'reset') {
        const { error } = await authService.resetPassword(email);
        if (error) throw error;
        setSuccessMsg('Password recovery instructions sent to your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await authService.signInWithGoogle();
      if (res.error) throw res.error;
      if (res.user) {
        onLogin(res.user.email, res.user.username);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-melody-card border border-melody-border rounded-3xl p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-melody-muted hover:text-white hover:bg-white/10 transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="space-y-6 text-center py-4">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-16 h-16 rounded-full mx-auto shadow-glow-accent border-2 border-white/20 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-glow-accent">
                {currentUser.username[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{currentUser.username}</h3>
              <p className="text-xs text-melody-muted mt-1">{currentUser.email}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-melody-muted flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isSupabaseConfigured ? 'Synced with Supabase Cloud' : 'Guest Account • Device Persistent'}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-melody-surface hover:bg-white/10 border border-melody-border text-white text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onLogout();
                  authService.signOut();
                  onClose();
                }}
                className="flex-1 py-3 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 text-xs font-semibold transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                {tab === 'signin' && 'Welcome Back'}
                {tab === 'signup' && 'Create Your Account'}
                {tab === 'reset' && 'Reset Password'}
              </h3>
              <p className="text-xs text-melody-muted">
                {isSupabaseConfigured
                  ? 'Sync playlists and favorites across web, Android, and iOS.'
                  : 'Free Guest Mode: your playlists and local music stay saved on this device.'}
              </p>
            </div>

            {/* Cloud vs Local Mode Status Badge */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-melody-muted font-mono">
              {isSupabaseConfigured ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  Supabase Cloud Auth Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <HardDrive className="w-3 h-3 text-purple-400" />
                  Local Guest Storage (Zero Setup Required)
                </span>
              )}
            </div>

            {/* Tabs */}
            {tab !== 'reset' && (
              <div className="flex p-1 rounded-xl bg-melody-surface border border-melody-border">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                    tab === 'signin' ? 'bg-melody-card text-white shadow-sm' : 'text-melody-muted hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                    tab === 'signup' ? 'bg-melody-card text-white shadow-sm' : 'text-melody-muted hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error or Success Notices */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Real Google Sign-in button */}
            {tab !== 'reset' && (
              <div className="space-y-3">
                <div className="flex justify-center w-full min-h-[40px]">
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          try {
                            const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
                            const userEmail = decoded.email || '';
                            const userName = decoded.name || userEmail.split('@')[0] || 'Google User';
                            const userAvatar = decoded.picture;
                            onLogin(userEmail, userName, userAvatar);
                            onClose();
                          } catch (err) {
                            setErrorMsg('Failed to process Google sign-in response.');
                          }
                        }
                      }}
                      onError={() => {
                        setErrorMsg('Google sign-in was unsuccessful. Please check your network or try again.');
                      }}
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      width="350"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setErrorMsg('To sign in with your real Google account, add your VITE_GOOGLE_CLIENT_ID to apps/web/.env.');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-xs transition flex items-center justify-center gap-2.5 shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-melody-muted uppercase tracking-wider">or with email</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-melody-muted uppercase">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-melody-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. musiclover"
                      className="w-full bg-melody-surface border border-melody-border focus:border-melody-accent rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-melody-muted uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-melody-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-melody-surface border border-melody-border focus:border-melody-accent rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {tab !== 'reset' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-melody-muted uppercase">Password</label>
                    {tab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setTab('reset');
                          setErrorMsg(null);
                        }}
                        className="text-[11px] text-melody-accentLight hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-melody-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-melody-surface border border-melody-border focus:border-melody-accent rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-melody-accent hover:bg-melody-accentLight disabled:opacity-50 text-white text-xs font-bold transition shadow-glow-accent hover:scale-102 active:scale-98"
              >
                {loading
                  ? 'Connecting...'
                  : tab === 'signin'
                  ? 'Sign In to Account'
                  : tab === 'signup'
                  ? 'Create Free Account'
                  : 'Send Reset Email'}
              </button>

              {tab === 'reset' && (
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="w-full text-center text-xs text-melody-muted hover:text-white"
                >
                  ← Back to Sign In
                </button>
              )}
            </form>

            {/* Guest Mode Divider */}
            <div className="pt-2 border-t border-white/5 text-center space-y-2">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition"
              >
                Continue as Offline Guest
              </button>
              <p className="text-[10px] text-melody-muted">
                No account needed for local audio files and offline playback.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
