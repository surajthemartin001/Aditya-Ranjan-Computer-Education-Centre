import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function LoginSelectPage({ data }: { data: PublicInstituteState }) {
  const { t } = useLanguage();
  const { settings } = data;

  return (
    <PublicLayout settings={settings}>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-medium text-blue-700">Unified Institutional Access</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            {t('auth.selectPortal')}
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {settings.instituteName} operates with exactly two secure portal entry points. Public institute information remains accessible without logging in.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal 1: Student Login */}
          <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="mt-5 font-editorial text-2xl font-semibold text-slate-950">
                Student Login
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t('auth.studentDesc')}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li>· Requires institute-issued Roll Number &amp; active status</li>
                <li>· Access attendance, fees, study materials, online tests &amp; certificates</li>
                <li>· Pending or unapproved applicants cannot log in</li>
              </ul>
            </div>

            <div className="mt-7 pt-5 border-t border-slate-100 space-y-2.5">
              <Link
                to="/login/student"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span>Open Student Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login/student?mode=activate"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t('auth.activateStudent')}</span>
              </Link>
            </div>
          </div>

          {/* Portal 2: Common Staff Login (Management + Teachers) */}
          <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="mt-5 font-editorial text-2xl font-semibold text-slate-950">
                Staff Login
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t('auth.staffDesc')}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li>· Managing Director → Management Dashboard</li>
                <li>· Head Teacher &amp; Teachers → Permission-based Teacher Dashboard</li>
                <li>· Role &amp; permissions verified securely via Firestore rules</li>
              </ul>
            </div>

            <div className="mt-7 pt-5 border-t border-slate-100">
              <Link
                to="/login/staff"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span>Open Staff Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-2.5 text-[11px] text-center text-slate-500">
                No public staff registration. Accounts are provisioned by Management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
