import React, { createContext, useContext, useState } from 'react';
import type { Language } from '../types/models';

const DICTIONARY: Record<string, { en: string; hi: string }> = {
  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.about': { en: 'About', hi: 'परिचय' },
  'nav.courses': { en: 'Courses', hi: 'पाठ्यक्रम' },
  'nav.fees': { en: 'Fees', hi: 'शुल्क' },
  'nav.faculty': { en: 'Faculty', hi: 'शिक्षकगण' },
  'nav.timetable': { en: 'Timetable', hi: 'समय-सारणी' },
  'nav.gallery': { en: 'Gallery', hi: 'गैलरी' },
  'nav.notices': { en: 'Notices', hi: 'सूचनाएं' },
  'nav.contact': { en: 'Contact', hi: 'संपर्क' },
  'nav.enquiry': { en: 'Admission Enquiry', hi: 'प्रवेश पूछताछ' },
  'nav.apply': { en: 'Apply for Admission', hi: 'प्रवेश आवेदन' },
  'nav.verify': { en: 'Verify Certificate', hi: 'प्रमाणपत्र सत्यापन' },
  'nav.login': { en: 'Portal Login', hi: 'पोर्टल लॉगिन' },
  'nav.institute': { en: 'Institute', hi: 'संस्थान' },
  'nav.studentPortal': { en: 'Student Portal', hi: 'छात्र पोर्टल' },
  'nav.staffPortal': { en: 'Staff Portal', hi: 'प्रबंधन / शिक्षक पोर्टल' },
  'nav.logout': { en: 'Logout', hi: 'लॉग आउट' },

  // Home & CTAs
  'hero.established': { en: 'Established 2017 · Simrahi Bazar, Supaul, Bihar', hi: 'स्थापना 2017 · सिमराही बाजार, सुपौल, बिहार' },
  'hero.ctaEnquiry': { en: 'Admission Enquiry', hi: 'प्रवेश पूछताछ' },
  'hero.ctaCourses': { en: 'Explore Courses', hi: 'पाठ्यक्रम देखें' },
  'hero.ctaStudentLogin': { en: 'Student Login', hi: 'छात्र लॉगिन' },
  'hero.ctaStaffLogin': { en: 'Staff Login', hi: 'स्टाफ लॉगिन' },
  'home.featuredCourses': { en: 'Academic Programs', hi: 'शैक्षणिक पाठ्यक्रम' },
  'home.whyChoose': { en: 'Why Choose Our Institute', hi: 'हमारे संस्थान को क्यों चुनें' },
  'home.infrastructure': { en: 'Computer Laboratory & Infrastructure', hi: 'कंप्यूटर प्रयोगशाला एवं बुनियादी ढांचा' },
  'home.faculty': { en: 'Faculty & Academic Guidance', hi: 'शिक्षकगण एवं शैक्षणिक मार्गदर्शन' },
  'home.notices': { en: 'Latest Public Notices', hi: 'नवीनतम सार्वजनिक सूचनाएं' },
  'home.gallery': { en: 'Campus & Lab Gallery', hi: 'कैंपस एवं लैब गैलरी' },
  'home.location': { en: 'Visit Our Center', hi: 'हमारे केंद्र पर पधारें' },

  // Common Labels
  'common.duration': { en: 'Duration', hi: 'अवधि' },
  'common.fee': { en: 'Fee', hi: 'शुल्क' },
  'common.theory': { en: 'Theory', hi: 'थ्योरी' },
  'common.practical': { en: 'Practical', hi: 'प्रैक्टिकल' },
  'common.viewAll': { en: 'View All', hi: 'सभी देखें' },
  'common.submit': { en: 'Submit', hi: 'जमा करें' },
  'common.save': { en: 'Save', hi: 'सहेजें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.call': { en: 'Call', hi: 'कॉल करें' },
  'common.email': { en: 'Email', hi: 'ईमेल' },
  'common.openMaps': { en: 'Open in Google Maps', hi: 'Google Maps में खोलें' },
  'common.backToPublic': { en: 'Public Website', hi: 'सार्वजनिक वेबसाइट' },

  // Auth
  'auth.selectPortal': { en: 'Select Portal Login', hi: 'पोर्टल लॉगिन चुनें' },
  'auth.studentDesc': {
    en: 'For institute-approved students using their issued Roll Number and password.',
    hi: 'संस्थान द्वारा स्वीकृत विद्यार्थियों के लिए रोल नंबर और पासवर्ड द्वारा लॉगिन।',
  },
  'auth.staffDesc': {
    en: 'Unified login for Managing Director, Head Teachers, Teachers, and authorized Staff.',
    hi: 'प्रबंध निदेशक, शिक्षकों और अधिकृत स्टाफ के लिए एकीकृत लॉगिन।',
  },
  'auth.activateStudent': { en: 'Activate Approved Student Account', hi: 'स्वीकृत छात्र खाता सक्रिय करें' },
  'auth.noExternalMsg': {
    en: 'All notices and academic announcements are delivered strictly inside this website. No SMS, WhatsApp, or automated emails are sent.',
    hi: 'सभी शैक्षणिक सूचनाएं केवल इसी वेबसाइट के अंदर दिखाई जाती हैं। कोई SMS, WhatsApp या स्वचालित ईमेल नहीं भेजा जाता।',
  },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'hi' : 'en'));

  const t = (key: string, fallback?: string) => {
    const entry = DICTIONARY[key];
    if (!entry) return fallback ?? key;
    return entry[lang];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
