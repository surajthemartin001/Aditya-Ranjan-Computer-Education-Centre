import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function CoursesPage({ data }: { data: PublicInstituteState }) {
  const { lang, t } = useLanguage();
  const { settings, courses, batches } = data;

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Academic Catalog</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            {t('nav.courses')} — {settings.instituteName}
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            All active courses published by Management are listed below. Visitors can inspect duration, fee structure, syllabus overview, and available batches without logging in.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        {courses.map((course) => {
          const courseBatches = batches.filter(
            (b) => b.courseId === course.id || b.courseCode === course.code
          );
          return (
            <article
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-4 bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200">
                <ImageWithFallback
                  src={course.imageUrl}
                  alt={course.name}
                  className="w-full h-full min-h-[240px] object-cover"
                />
              </div>

              <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-slate-500">
                    <span className="font-semibold text-slate-900">{course.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>Duration: {course.duration}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-blue-700">Fee: {course.feeLabel}</span>
                  </div>

                  <h2 className="mt-2 font-editorial text-2xl font-semibold text-slate-950">
                    {lang === 'hi' && course.nameHi ? course.nameHi : course.name}
                  </h2>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {lang === 'hi' && course.descriptionHi ? course.descriptionHi : course.description}
                  </p>

                  {course.feeNote && (
                    <p className="mt-2 text-xs text-slate-500">{course.feeNote}</p>
                  )}

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-slate-100">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                        Syllabus Overview
                      </h3>
                      <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                        {(course.syllabusOverview || []).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-xs text-slate-400 mt-0.5">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                        Learning Outcomes & Eligibility
                      </h3>
                      {course.eligibility && (
                        <p className="mt-2 text-xs text-slate-500">
                          Eligibility: {course.eligibility}
                        </p>
                      )}
                      <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                        {(course.outcomes || []).map((o, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {courseBatches.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                        Available Batches
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-600 font-mono tabular-nums">
                        {courseBatches.map((b) => (
                          <span key={b.id} className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="font-sans text-slate-800">{b.name}:</strong>
                            <span>
                              Theory {b.theoryTime} / Practical {b.practicalTime}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/enquiry?course=${encodeURIComponent(course.code)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <span>Admission Enquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/admission?course=${encodeURIComponent(course.id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span>Apply for Admission</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PublicLayout>
  );
}
