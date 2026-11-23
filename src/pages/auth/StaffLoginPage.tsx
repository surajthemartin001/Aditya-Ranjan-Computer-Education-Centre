import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck, LogIn } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { useAuth, type ResolvedPortalRole } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import { firebaseProjectId } from '../../lib/firebase';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function StaffLoginPage({ data }: { data: PublicInstituteState }) {
  const { settings } = data;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    role,
    statusMessage,
    signInStaffWithGoogle,
    signInStaffWithPassword,
    requestPasswordReset,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailSetupHint, setShowEmailSetupHint] = useState(false);

  const routeByRole = (resolved: ResolvedPortalRole) => {
    if (resolved === 'managing_director') {
      navigate('/management', { replace: true });
    } else if (resolved === 'head_teacher' || resolved === 'teacher' || resolved === 'staff') {
      navigate('/teacher', { replace: true });
    } else if (resolved === 'student') {
      setErrorMsg('This account belongs to a Student. Please use Student Login.');
    } else {
      setErrorMsg(
        'This account is not registered as Managing Director, Teacher, or Staff. Contact the Managing Director to provision staff access.'
      );
    }
  };

  useEffect(() => {
    if (role === 'managing_director') navigate('/management', { replace: true });
    if (role === 'head_teacher' || role === 'teacher' || role === 'staff') {
      navigate('/teacher', { replace: true });
    }
  }, [role, navigate]);

  const handleGoogleStaffLogin = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const resolved = await signInStaffWithGoogle();
      if (resolved === 'managing_director' || resolved === 'head_teacher' || resolved === 'teacher' || resolved === 'staff') {
        showToast('Authenticated successfully.', 'success');
      }
      routeByRole(resolved);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    try {
      const resolved = await signInStaffWithPassword(email, password);
      routeByRole(resolved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      if (msg.includes('operation-not-allowed')) {
        setShowEmailSetupHint(true);
        setErrorMsg(
          'Email/Password login is not enabled yet in Firebase Console. Use "Sign In with Registered Google Account" above for immediate Managing Director / Staff access.'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your registered staff email address above first.');
      return;
    }
    try {
      await requestPasswordReset(email);
      showToast('Password recovery initiated via Firebase Authentication.', 'info');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send reset request.');
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-200">
            <p className="text-xs font-medium text-blue-700">
              Portal 2 · Unified Management &amp; Teacher Login
            </p>
            <h1 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
              Staff Login
            </h1>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Managing Director, Head Teachers, Teachers, and authorized Staff sign in here. Role permissions are verified automatically after authentication.
            </p>
          </div>

          {(errorMsg || statusMessage) && (
            <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p>{errorMsg || statusMessage}</p>
                {showEmailSetupHint && (
                  <p className="mt-2 text-slate-700">
                    To enable Email/Password sign-in, visit{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-blue-700"
                    >
                      Firebase Console → Authentication → Sign-in method
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Primary Recommended Firebase Auth (Google) */}
          <div className="mt-6">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGoogleStaffLogin()}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{busy ? 'Verifying Role...' : 'Sign In with Registered Google Account'}</span>
            </button>
            <p className="mt-2 text-[11px] text-slate-500 text-center">
              Verified Managing Director &amp; invited faculty sign in immediately with zero hardcoded passwords.
            </p>
          </div>

          <div className="relative my-6">
            <div className="border-t border-slate-200" />
            <span className="bg-white px-2.5 text-[11px] text-slate-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              or Email &amp; Password
            </span>
          </div>

          <form onSubmit={handlePasswordStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Registered Staff Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@institute.edu"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
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
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Email &amp; Password</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Public staff registration is disabled.</span>
            <Link to="/login/student" className="text-blue-700 hover:underline">
              Student Login →
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
