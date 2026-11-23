import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { usePublicInstituteData } from './hooks/usePublicInstituteData';

import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { CoursesPage } from './pages/public/CoursesPage';
import { FeesPage } from './pages/public/FeesPage';
import { FacultyPage } from './pages/public/FacultyPage';
import { TimetablePage } from './pages/public/TimetablePage';
import { GalleryPage } from './pages/public/GalleryPage';
import { NoticesPage } from './pages/public/NoticesPage';
import { ContactPage } from './pages/public/ContactPage';
import { EnquiryPage } from './pages/public/EnquiryPage';
import { AdmissionApplicationPage } from './pages/public/AdmissionApplicationPage';
import { CertificateVerifyPage } from './pages/public/CertificateVerifyPage';

import { LoginSelectPage } from './pages/auth/LoginSelectPage';
import { StudentLoginPage } from './pages/auth/StudentLoginPage';
import { StaffLoginPage } from './pages/auth/StaffLoginPage';

import { StudentPortalPage } from './pages/student/StudentPortalPage';
import { ManagementPortalPage } from './pages/management/ManagementPortalPage';
import { TeacherPortalPage } from './pages/teacher/TeacherPortalPage';

function AppRoutes() {
  const publicData = usePublicInstituteData();

  return (
    <Routes>
      {/* Portal 1: Public Website (Complete Access Without Login) */}
      <Route path="/" element={<HomePage data={publicData} />} />
      <Route path="/about" element={<AboutPage data={publicData} />} />
      <Route path="/courses" element={<CoursesPage data={publicData} />} />
      <Route path="/fees" element={<FeesPage data={publicData} />} />
      <Route path="/faculty" element={<FacultyPage data={publicData} />} />
      <Route path="/timetable" element={<TimetablePage data={publicData} />} />
      <Route path="/gallery" element={<GalleryPage data={publicData} />} />
      <Route path="/notices" element={<NoticesPage data={publicData} />} />
      <Route path="/contact" element={<ContactPage data={publicData} />} />
      <Route path="/enquiry" element={<EnquiryPage data={publicData} />} />
      <Route path="/admission" element={<AdmissionApplicationPage data={publicData} />} />
      <Route path="/verify-certificate" element={<CertificateVerifyPage data={publicData} />} />

      {/* Exactly Two Portal Login Entry Points */}
      <Route path="/login" element={<LoginSelectPage data={publicData} />} />
      <Route path="/login/student" element={<StudentLoginPage data={publicData} />} />
      <Route path="/login/staff" element={<StaffLoginPage data={publicData} />} />

      {/* Portal 1 (Authenticated): Approval-Based Student Portal */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['student']} redirectTo="/login/student">
            <StudentPortalPage data={publicData} />
          </ProtectedRoute>
        }
      />

      {/* Portal 2 (Authenticated): Managing Director Management Portal */}
      <Route
        path="/management/*"
        element={
          <ProtectedRoute allowedRoles={['managing_director']} redirectTo="/login/staff">
            <ManagementPortalPage data={publicData} />
          </ProtectedRoute>
        }
      />

      {/* Portal 2 (Authenticated): Permission-Based Teacher & Staff Portal */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute
            allowedRoles={['head_teacher', 'teacher', 'staff', 'managing_director']}
            redirectTo="/login/staff"
          >
            <TeacherPortalPage data={publicData} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
