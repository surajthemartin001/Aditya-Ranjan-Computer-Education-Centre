import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, BookOpen, Monitor, Target, Compass } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useLanguage } from '../../i18n/LanguageContext';
import { INSTITUTE_IMAGES } from '../../data/verifiedDefaults';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function AboutPage({ data }: { data: PublicInstituteState }) {
  const { lang } = useLanguage();
  const { settings, content } = data;
  const about = content.about;

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <p className="text-xs font-medium text-blue-700">
            Established {settings.establishedYear} · Single Dedicated Center
          </p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950 max-w-3xl">
            {lang === 'hi' ? about?.heroTitleHi : about?.heroTitle}
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl leading-relaxed">
            {lang === 'hi' ? about?.heroSubtitleHi : about?.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* History & Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-slate-950">
              History & Institutional Overview
            </h2>
            <p className="text-base text-slate-700 leading-relaxed">
              {lang === 'hi' ? about?.bodyHi : about?.body}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <Compass className="w-5 h-5 text-blue-700" />
                <h3 className="mt-3 text-base font-semibold text-slate-900">Vision</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{about?.vision}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <Target className="w-5 h-5 text-blue-700" />
                <h3 className="mt-3 text-base font-semibold text-slate-900">Mission</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{about?.mission}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <ImageWithFallback
                  src={INSTITUTE_IMAGES.director}
                  alt={settings.managingDirector}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Managing Director</p>
                <h3 className="text-lg font-semibold text-slate-900">{settings.managingDirector}</h3>
                <p className="text-sm text-slate-600">{settings.directorQualification}</p>
              </div>
            </div>
            <dl className="mt-6 pt-5 border-t border-slate-200 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-700">{settings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${settings.contactPhone}`} className="font-mono tabular-nums text-blue-700 hover:underline">
                  +91 {settings.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="text-slate-700 hover:text-blue-700 break-all">
                  {settings.contactEmail}
                </a>
              </div>
            </dl>
          </div>
        </div>

        {/* Teaching Methodology & Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <h2 className="mt-3 font-editorial text-xl font-semibold text-slate-950">
              Teaching Methodology
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{about?.methodology}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <Monitor className="w-5 h-5 text-blue-700" />
            <h2 className="mt-3 font-editorial text-xl font-semibold text-slate-950">
              Infrastructure & Facilities
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{about?.infrastructureNote}</p>
          </div>
        </div>

        {/* Institute Photographs */}
        <div>
          <h2 className="font-editorial text-2xl font-semibold text-slate-950 mb-5">
            Campus & Laboratory Environment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <figure className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[16/9]">
                <ImageWithFallback
                  src={INSTITUTE_IMAGES.heroLab}
                  alt="Computer Laboratory"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="p-4 text-xs text-slate-600">
                Computer Laboratory — Structured workstations for daily practical sessions.
              </figcaption>
            </figure>
            <figure className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[16/9]">
                <ImageWithFallback
                  src={INSTITUTE_IMAGES.classroom}
                  alt="Theory Classroom"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="p-4 text-xs text-slate-600">
                Theory Classroom — Focused lecture instruction before lab practice.
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <Link
            to="/courses"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Explore Courses
          </Link>
          <Link
            to="/faculty"
            className="px-5 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            Meet Faculty
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
