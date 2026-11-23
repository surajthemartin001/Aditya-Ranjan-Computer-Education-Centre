import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  Monitor,
  BookOpen,
  Users,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useLanguage } from '../../i18n/LanguageContext';
import { INSTITUTE_IMAGES } from '../../data/verifiedDefaults';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function HomePage({ data }: { data: PublicInstituteState }) {
  const { lang, t } = useLanguage();
  const { settings, content, courses, batches, faculty, notices, gallery } = data;
  const homeContent = content.home;

  const heroTitle =
    lang === 'hi'
      ? homeContent?.heroTitleHi || '2017 से सिमराही बाजार में व्यावहारिक कंप्यूटर शिक्षा'
      : homeContent?.heroTitle || 'Practical Computer Education in Simrahi Bazar Since 2017';

  const heroSubtitle =
    lang === 'hi'
      ? homeContent?.heroSubtitleHi || ''
      : homeContent?.heroSubtitle || '';

  return (
    <PublicLayout settings={settings}>
      {/* Asymmetric Institutional Editorial Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium tracking-wide text-blue-700">
                {t('hero.established')}
              </p>
              <h1 className="mt-4 font-editorial text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold leading-[1.15] tracking-tight text-slate-950">
                {heroTitle}
              </h1>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              {/* Primary & Secondary Institutional CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/enquiry"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t('hero.ctaEnquiry')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t('hero.ctaCourses')}</span>
                </Link>
              </div>

              {/* Portal Entry Links */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <Link
                  to="/login/student"
                  className="font-medium text-slate-800 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  {t('hero.ctaStudentLogin')} →
                </Link>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <Link
                  to="/login/staff"
                  className="font-medium text-slate-800 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  {t('hero.ctaStaffLogin')} →
                </Link>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <Link
                  to="/admission"
                  className="font-medium text-slate-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  {t('nav.apply')} →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[300px] lg:min-h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ImageWithFallback
                  src={INSTITUTE_IMAGES.heroLab}
                  alt="Computer education laboratory at Aditya Ranjan Computer Education Center"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Operational Utility Strip (Full-Width Row Below Hero) */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500">Established</p>
              <p className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
                {settings.establishedYear}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">Simrahi Bazar, Supaul</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Managing Director</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {settings.managingDirector}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{settings.directorQualification}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Daily Lab & Theory Hours</p>
              <p className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
                6:30 AM – 5:00 PM
              </p>
              <p className="mt-0.5 text-xs text-slate-600">Morning Batches & Support Class</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Admission Desk</p>
              <a
                href={`tel:${settings.contactPhone}`}
                className="mt-1 block text-lg font-semibold font-mono tabular-nums text-blue-700 hover:underline"
              >
                +91 {settings.contactPhone}
              </a>
              <p className="mt-0.5 text-xs text-slate-600 truncate">{settings.contactEmail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-blue-700">Curriculum & Training</p>
            <h2 className="mt-1.5 font-editorial text-2xl sm:text-3xl font-semibold text-slate-950">
              {t('home.featuredCourses')}
            </h2>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <span>{t('common.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <article
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 border-b border-slate-200 overflow-hidden">
                <ImageWithFallback
                  src={course.imageUrl}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                  <span className="font-semibold text-slate-800">{course.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{course.duration}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-blue-700">{course.feeLabel}</span>
                </div>
                <h3 className="mt-2.5 text-lg font-semibold text-slate-900 leading-snug">
                  {lang === 'hi' && course.nameHi ? course.nameHi : course.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                  {lang === 'hi' && course.descriptionHi ? course.descriptionHi : course.description}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to="/courses"
                    className="text-sm font-medium text-slate-700 hover:text-slate-950"
                  >
                    Syllabus & Details
                  </Link>
                  <Link
                    to={`/enquiry?course=${encodeURIComponent(course.code)}`}
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    Enquire →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why Choose Our Institute & Infrastructure Highlights */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-blue-700">Academic Standards</p>
              <h2 className="mt-1.5 font-editorial text-2xl sm:text-3xl font-semibold text-slate-950">
                {t('home.whyChoose')}
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                {lang === 'hi' ? homeContent?.bodyHi : homeContent?.body}
              </p>

              <div className="mt-8 rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                <ImageWithFallback
                  src={INSTITUTE_IMAGES.classroom}
                  alt="Theory classroom at Aditya Ranjan Computer Education Center"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Monitor,
                  title: 'Balanced Theory & Practical Lab',
                  desc: 'Dedicated consecutive theory and practical hours in morning batches so students apply concepts immediately on desktop workstations.',
                },
                {
                  icon: Clock,
                  title: 'Special Support Class (3:00–5:00 PM)',
                  desc: 'Afternoon guided revision and extra practical lab time for learners needing additional help with concepts or typing practice.',
                },
                {
                  icon: BookOpen,
                  title: 'Hindi & English Bilingual Focus',
                  desc: 'Accessible instruction and dedicated bilingual typing training (8:30 AM – 10:30 AM) tailored to regional learners.',
                },
                {
                  icon: Users,
                  title: 'Verified Approval-Based Student Portal',
                  desc: 'Enrolled students receive institute-issued Roll Numbers with structured access to attendance, fee receipts, study materials, and tests.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 bg-[#FAFBFD] border border-slate-200 rounded-xl"
                >
                  <item.icon className="w-5 h-5 text-blue-700" />
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}

              {/* Compact Public Timetable Preview */}
              <div className="sm:col-span-2 p-6 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Current Class Schedule Snapshot
                  </h3>
                  <Link
                    to="/timetable"
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    Full Timetable →
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {batches.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="font-medium text-slate-900">{b.name}</span>
                      <span className="text-xs font-mono tabular-nums text-slate-600">
                        Theory: {b.theoryTime} · Practical: {b.practicalTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty & Public Notices Split Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Faculty Introduction */}
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-blue-700">Leadership & Instructors</p>
                <h2 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
                  {t('home.faculty')}
                </h2>
              </div>
              <Link to="/faculty" className="text-sm font-medium text-blue-700 hover:underline">
                All Faculty →
              </Link>
            </div>

            <div className="mt-6 space-y-5">
              {faculty.slice(0, 2).map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    <ImageWithFallback
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {member.designation} · {member.qualification}
                    </p>
                    <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
                      {member.showPublicPhone && member.publicPhone && (
                        <a
                          href={`tel:${member.publicPhone}`}
                          className="inline-flex items-center gap-1.5 text-blue-700 hover:underline font-mono tabular-nums"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>+91 {member.publicPhone}</span>
                        </a>
                      )}
                      {member.showPublicEmail && member.publicEmail && (
                        <a
                          href={`mailto:${member.publicEmail}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-700"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{member.publicEmail}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public Notices */}
          <div className="lg:col-span-5">
            <div className="flex items-end justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-blue-700">Official Board</p>
                <h2 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
                  {t('home.notices')}
                </h2>
              </div>
              <Link to="/notices" className="text-sm font-medium text-blue-700 hover:underline">
                All Notices →
              </Link>
            </div>

            <div className="mt-6 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {notices.slice(0, 4).map((notice) => (
                <div key={notice.id} className="p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span>{notice.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{notice.publishedDate}</span>
                    {notice.isPinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-700 font-sans font-medium">Pinned</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-900">{notice.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {notice.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-medium text-blue-700">Campus & Facilities</p>
              <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold text-slate-950">
                {t('home.gallery')}
              </h2>
            </div>
            <Link to="/gallery" className="text-sm font-medium text-blue-700 hover:underline">
              Explore Gallery →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gallery.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                to="/gallery"
                className="group block border border-slate-200 rounded-xl overflow-hidden bg-[#FAFBFD]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <ImageWithFallback
                    src={item.mediaUrl}
                    alt={item.altText || item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500">{item.category}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 truncate">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Admission Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="bg-slate-950 text-white rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium text-blue-300">Single Dedicated Center · Supaul, Bihar</p>
            <h2 className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-white">
              {t('home.location')}
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
              <span>{lang === 'hi' ? settings.addressHi : settings.address}</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-200">
              <a
                href={`tel:${settings.contactPhone}`}
                className="inline-flex items-center gap-2 font-mono tabular-nums hover:text-white"
              >
                <Phone className="w-4 h-4 text-blue-300" />
                <span>+91 {settings.contactPhone}</span>
              </a>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <Mail className="w-4 h-4 text-blue-300" />
                <span>{settings.contactEmail}</span>
              </a>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Online admission enquiries and applications require no account or login.</span>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>{t('common.openMaps')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/admission"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>{t('nav.apply')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
