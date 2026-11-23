import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_WEBSITE_SETTINGS } from '../data/verifiedDefaults';
import type { WebsiteSettings } from '../types/models';

interface PublicLayoutProps {
  children: React.ReactNode;
  settings?: WebsiteSettings;
}

export function PublicLayout({ children, settings = DEFAULT_WEBSITE_SETTINGS }: PublicLayoutProps) {
  const { lang, toggleLang, t } = useLanguage();
  const { role } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const portalTarget =
    role === 'managing_director'
      ? '/management'
      : role === 'head_teacher' || role === 'teacher' || role === 'staff'
        ? '/teacher'
        : role === 'student'
          ? '/student'
          : '/login';

  const portalLabel =
    role === 'managing_director'
      ? 'Management Portal'
      : role === 'head_teacher' || role === 'teacher' || role === 'staff'
        ? 'Teacher Portal'
        : role === 'student'
          ? t('nav.studentPortal')
          : t('nav.login');

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-editorial text-base sm:text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {lang === 'hi' ? 'आदित्य रंजन कंप्यूटर एजुकेशन' : 'Aditya Ranjan Computer Education'}
          </Link>

          {/* Zone 2: Clean single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              to="/courses"
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                isActive('/courses') ? 'text-blue-700' : ''
              }`}
            >
              {t('nav.courses')}
            </Link>
            <Link
              to="/fees"
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                isActive('/fees') ? 'text-blue-700' : ''
              }`}
            >
              {t('nav.fees')}
            </Link>
            <Link
              to="/faculty"
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                isActive('/faculty') ? 'text-blue-700' : ''
              }`}
            >
              {t('nav.faculty')}
            </Link>
            <Link
              to="/timetable"
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                isActive('/timetable') ? 'text-blue-700' : ''
              }`}
            >
              {t('nav.timetable')}
            </Link>
            <Link
              to="/gallery"
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                isActive('/gallery') ? 'text-blue-700' : ''
              }`}
            >
              {t('nav.gallery')}
            </Link>

            {/* Clean Institute Dropdown for remaining public pages */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer"
                aria-expanded={dropdownOpen}
              >
                <span>{t('nav.institute')}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 z-50">
                  <Link
                    to="/about"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.about')}
                  </Link>
                  <Link
                    to="/notices"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.notices')}
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.contact')}
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    to="/enquiry"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.enquiry')}
                  </Link>
                  <Link
                    to="/admission"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.apply')}
                  </Link>
                  <Link
                    to="/verify-certificate"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {t('nav.verify')}
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>{lang === 'en' ? 'भाषा बदलें: हिन्दी' : 'Switch Language: English'}</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Primary Action + Mobile Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={portalTarget}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              {portalLabel}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
            {[
              { to: '/', label: t('nav.home') },
              { to: '/about', label: t('nav.about') },
              { to: '/courses', label: t('nav.courses') },
              { to: '/fees', label: t('nav.fees') },
              { to: '/faculty', label: t('nav.faculty') },
              { to: '/timetable', label: t('nav.timetable') },
              { to: '/gallery', label: t('nav.gallery') },
              { to: '/notices', label: t('nav.notices') },
              { to: '/contact', label: t('nav.contact') },
              { to: '/enquiry', label: t('nav.enquiry') },
              { to: '/admission', label: t('nav.apply') },
              { to: '/verify-certificate', label: t('nav.verify') },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.to)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleLang}
                className="px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
              >
                {lang === 'en' ? 'हिन्दी' : 'English'}
              </button>
              <Link
                to={portalTarget}
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg"
              >
                {portalLabel}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Authoritative Institutional Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="font-editorial text-lg font-semibold text-white">
              {lang === 'hi' ? settings.instituteNameHi : settings.instituteName}
            </h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {t('hero.established')}
            </p>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Managing Director: {settings.managingDirector}, {settings.directorQualification}
            </p>
            <button
              type="button"
              onClick={toggleLang}
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-md px-3 py-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'हिन्दी संस्करण देखें' : 'View in English'}</span>
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Academic & Information</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">{t('nav.courses')}</Link></li>
              <li><Link to="/fees" className="hover:text-white transition-colors">{t('nav.fees')}</Link></li>
              <li><Link to="/timetable" className="hover:text-white transition-colors">{t('nav.timetable')}</Link></li>
              <li><Link to="/faculty" className="hover:text-white transition-colors">{t('nav.faculty')}</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">{t('nav.gallery')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Admissions & Portals</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/enquiry" className="hover:text-white transition-colors">{t('nav.enquiry')}</Link></li>
              <li><Link to="/admission" className="hover:text-white transition-colors">{t('nav.apply')}</Link></li>
              <li><Link to="/notices" className="hover:text-white transition-colors">{t('nav.notices')}</Link></li>
              <li><Link to="/verify-certificate" className="hover:text-white transition-colors">{t('nav.verify')}</Link></li>
              <li><Link to="/login/student" className="hover:text-white transition-colors">{t('hero.ctaStudentLogin')}</Link></li>
              <li><Link to="/login/staff" className="hover:text-white transition-colors">{t('hero.ctaStaffLogin')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Center Address & Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{lang === 'hi' ? settings.addressHi : settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${settings.contactPhone}`} className="font-mono tabular-nums hover:text-white">
                  +91 {settings.contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white break-all">
                  {settings.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              © {new Date().getFullYear()} {settings.instituteName}. Est. {settings.establishedYear}.
            </span>
            <span>All announcements remain strictly inside this institutional portal.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
