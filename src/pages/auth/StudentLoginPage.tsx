import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, KeyRound, LogIn } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import { firebaseProjectId } from '../../lib/firebase';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function StudentLoginPage({ data }: { data: PublicInstituteState }) {
  const { settings } = data;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    role,
    statusMessage,
    signInStudentWithRollAndPassword,
    signInStudentWithGoogle,
    activateStudentWithPassword,
    activateStudentWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'activate'>(
    searchParams.get('mode') === 'activate' ? 'activate' : 'login'
  );
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsEmailAuthEnable, setNeedsEmailAuthEnable] = useState(false);

  useEffect(() => {
    if (role === 'student') {
      navigate('/student', { replace: true });
    }
  }, [role, navigate]);

  const handleError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Authentication failed.';
    if (msg.includes('operation-not-allowed') || msg.includes('admin-restricted-operation')) {
      setNeedsEmailAuthEnable(true);
      setErrorMsg(
        'Email/Password sign-in is not yet enabled in Firebase Console. You can either enable Email/Password in Firebase Console OR activate/sign in immediately using your Google Account below.'
      );
    } else {
      setErrorMsg(msg);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    try {
      await signInStudentWithRollAndPassword(rollNumber, password);
      showToast('Signed in to Student Portal.', 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleActivatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await activateStudentWithPassword({ rollNumber, activationCode, password });
      showToast('Student account activated! Opening Student Dashboard.', 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleActivateGoogle = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await activateStudentWithGoogle({ rollNumber, activationCode });
      showToast('Student account activated and linked! Opening Student Dashboard.', 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await signInStudentWithGoogle();
      showToast('Signed in to Student Portal.', 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 pb-5 border-b border-slate-200">
            <div>
              <p className="text-xs font-medium text-blue-700">Portal 1 · Approved Students Only</p>
              <h1 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
                {mode === 'login' ? 'Student Login' : 'Activate Approved Student Account'}
              </h1>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-5 flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('activate');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'activate'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              First-Time Activation
            </button>
          </div>

          {(errorMsg || statusMessage) && (
            <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p>{errorMsg || statusMessage}</p>
                {needsEmailAuthEnable && (
                  <p className="mt-2 text-slate-700">
                    Admin setup note: Open{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-blue-700"
                    >
                      Firebase Console → Authentication → Sign-in method
                    </a>{' '}
                    and enable <strong>Email/Password</strong> for Roll Number + Password logins.
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Institute Roll Number / Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., ARCEC-2026-0001"
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{busy ? 'Signing in...' : 'Sign In with Roll Number'}</span>
              </button>

              <div className="relative py-2">
                <div className="border-t border-slate-200" />
                <span className="bg-white px-2 text-[11px] text-slate-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  or if activated with Google
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGoogleLogin()}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In with Linked Google Account
              </button>

              <p className="text-xs text-slate-500 pt-2">
                Forgot password? Please contact the institute office to reset or re-issue access. No automated SMS or emails are sent.
              </p>
            </form>
          ) : (
            <form onSubmit={handleActivatePassword} className="mt-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the <strong>Roll Number</strong> and <strong>Activation Code</strong> issued by Management after your admission was approved.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Issued Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., ARCEC-2026-0001"
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Institute Activation Code *
                </label>
                <input
                  type="text"
                  required
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="e.g., ACT7K9M2P"
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Create Password (min. 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set your private password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>{busy ? 'Activating...' : 'Activate Account & Set Password'}</span>
              </button>

              <div className="relative py-2">
                <div className="border-t border-slate-200" />
                <span className="bg-white px-2 text-[11px] text-slate-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  or activate using Google
                </span>
              </div>

              <button
                type="button"
                disabled={busy || !rollNumber.trim() || !activationCode.trim()}
                onClick={() => void handleActivateGoogle()}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Verify Roll Number &amp; Activate with Google
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <Link to="/admission" className="text-blue-700 hover:underline">
              Not admitted yet? Apply online
            </Link>
            <Link to="/login/staff" className="hover:text-slate-900">
              Staff Login →
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
