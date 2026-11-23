import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  BookOpen,
  ClipboardList,
  FileCheck2,
  CalendarCheck,
  IndianRupee,
  Award,
  Megaphone,
  Users,
  Globe,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Printer,
  Menu,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useToast } from '../../components/ToastContext';
import { NotificationBell } from '../../components/NotificationBell';
import { PrintableCertificateModal } from '../../components/PrintableCertificateModal';
import { makeSafeId } from '../../services/firestoreService';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';
import type {
  Announcement,
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  CertificateRecord,
  Examination,
  ExamResult,
  FeeRecord,
  Payment,
  StudyMaterial,
} from '../../types/models';

type StudentTab =
  | 'overview'
  | 'profile'
  | 'learning'
  | 'assignments'
  | 'tests'
  | 'attendance'
  | 'fees'
  | 'certificates'
  | 'announcements';

export function StudentPortalPage({ data }: { data: PublicInstituteState }) {
  const { firebaseUser, studentProfile, refreshProfile, logout } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<StudentTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Profile edit fields (non-sensitive only)
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Assignment submission state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Active MCQ test state
  const [activeExam, setActiveExam] = useState<Examination | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [submittingExam, setSubmittingExam] = useState(false);

  // Certificate & Receipt preview modals
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Payment | null>(null);

  // Announcement search
  const [annSearch, setAnnSearch] = useState('');

  const loadStudentData = useCallback(async () => {
    if (!firebaseUser || !studentProfile) return;
    setLoading(true);
    try {
      const uid = firebaseUser.uid;
      const sid = studentProfile.id;
      const safeList = async <T,>(q: ReturnType<typeof query>): Promise<T[]> => {
        try {
          const snap = await getDocs(q);
          return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as T);
        } catch {
          return [];
        }
      };

      const [
        attList,
        matList,
        asgList,
        subList,
        examList,
        resList,
        feeList,
        payList,
        certList,
        annList,
        readSnap,
      ] = await Promise.all([
        safeList<AttendanceRecord>(query(collection(db, 'attendance'), where('studentId', '==', sid))),
        safeList<StudyMaterial>(query(collection(db, 'studyMaterials'), where('isPublished', '==', true))),
        safeList<Assignment>(query(collection(db, 'assignments'), where('isPublished', '==', true))),
        safeList<AssignmentSubmission>(
          query(collection(db, 'assignmentSubmissions'), where('studentUid', '==', uid))
        ),
        safeList<Examination>(query(collection(db, 'examinations'), where('isPublished', '==', true))),
        safeList<ExamResult>(query(collection(db, 'results'), where('studentId', '==', sid))),
        safeList<FeeRecord>(query(collection(db, 'feeRecords'), where('studentId', '==', sid))),
        safeList<Payment>(query(collection(db, 'payments'), where('studentId', '==', sid))),
        safeList<CertificateRecord>(
          query(collection(db, 'certificates'), where('studentId', '==', sid))
        ),
        safeList<Announcement>(query(collection(db, 'announcements'), where('status', '==', 'published'))),
        getDocs(query(collection(db, 'announcementReads'), where('userId', '==', uid))).catch(() => null),
      ]);

      setAttendance(attList.sort((a, b) => b.date.localeCompare(a.date)));
      setMaterials(
        matList.filter(
          (m) => !studentProfile.courseId || !m.courseId || m.courseId === studentProfile.courseId
        )
      );
      setAssignments(
        asgList.filter(
          (a) => !studentProfile.courseId || !a.courseId || a.courseId === studentProfile.courseId
        )
      );
      setSubmissions(subList);
      setExams(
        examList.filter(
          (e) => !studentProfile.courseId || !e.courseId || e.courseId === studentProfile.courseId
        )
      );
      setResults(resList);
      setFeeRecords(feeList);
      setPayments(payList.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)));
      setCertificates(certList);
      setAnnouncements(
        annList.filter((a) => {
          if (a.audience === 'all_internal' || a.audience === 'all_students') return true;
          if (a.audience === 'course' && a.targetCourseId === studentProfile.courseId) return true;
          if (a.audience === 'batch' && a.targetBatchId === studentProfile.batchId) return true;
          return false;
        })
      );
      if (readSnap) {
        setReadIds(new Set(readSnap.docs.map((d) => String(d.data().announcementId || ''))));
      }
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, studentProfile]);

  useEffect(() => {
    void loadStudentData();
  }, [loadStudentData]);

  useEffect(() => {
    if (studentProfile) {
      setEditPhone(studentProfile.phone || '');
      setEditAddress(studentProfile.address || '');
      setEditPhotoUrl(studentProfile.photoUrl || '');
    }
  }, [studentProfile]);

  const enrolledCourse = useMemo(
    () =>
      data.courses.find(
        (c) => c.id === studentProfile?.courseId || c.name === studentProfile?.courseName
      ),
    [data.courses, studentProfile]
  );

  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, absent, pct };
  }, [attendance]);

  const primaryFee = feeRecords[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'studentProfiles', studentProfile.id), {
        phone: editPhone.trim().slice(0, 25),
        address: editAddress.trim().slice(0, 400),
        photoUrl: editPhotoUrl.trim().slice(0, 600),
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      showToast('Profile details updated.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `studentProfiles/${studentProfile.id}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !firebaseUser || !studentProfile) return;
    setSubmittingAssignment(true);
    const subId = makeSafeId('SUB');
    try {
      await setDoc(doc(db, 'assignmentSubmissions', subId), {
        assignmentId: activeAssignment.id,
        studentId: studentProfile.id,
        studentUid: firebaseUser.uid,
        studentName: studentProfile.name,
        rollNumber: studentProfile.rollNumber,
        submissionText: submissionText.trim().slice(0, 3000),
        attachmentUrl: submissionLink.trim().slice(0, 1000),
        status: 'submitted',
        submittedAt: serverTimestamp(),
      });
      showToast('Assignment submitted successfully.', 'success');
      setActiveAssignment(null);
      setSubmissionText('');
      setSubmissionLink('');
      await loadStudentData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `assignmentSubmissions/${subId}`);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeExam || !firebaseUser || !studentProfile) return;
    setSubmittingExam(true);
    let score = 0;
    let totalMarks = 0;
    for (const q of activeExam.questions || []) {
      totalMarks += Number(q.marks || 1);
      if (examAnswers[q.id] === q.correctIndex) {
        score += Number(q.marks || 1);
      }
    }
    const finalTotal = totalMarks > 0 ? totalMarks : activeExam.totalMarks || 1;
    const percentage = Math.round((score / finalTotal) * 100);
    const passed = score >= (activeExam.passingMarks || Math.ceil(finalTotal * 0.4));
    const resId = makeSafeId('RES');

    try {
      await setDoc(doc(db, 'results', resId), {
        examId: activeExam.id,
        examTitle: activeExam.title,
        studentId: studentProfile.id,
        studentUid: firebaseUser.uid,
        studentName: studentProfile.name,
        rollNumber: studentProfile.rollNumber,
        courseId: studentProfile.courseId || activeExam.courseId,
        score,
        totalMarks: finalTotal,
        percentage,
        passed,
        answers: examAnswers,
        submittedAt: serverTimestamp(),
      });
      showToast(`Test evaluated! Score: ${score}/${finalTotal} (${percentage}%).`, 'success');
      setActiveExam(null);
      setExamAnswers({});
      await loadStudentData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `results/${resId}`);
    } finally {
      setSubmittingExam(false);
    }
  };

  const markAnnouncementRead = async (annId: string) => {
    if (!firebaseUser) return;
    const docId = `${annId}_${firebaseUser.uid}`;
    try {
      await setDoc(doc(db, 'announcementReads', docId), {
        announcementId: annId,
        userId: firebaseUser.uid,
        readAt: serverTimestamp(),
      });
      setReadIds((prev) => new Set(prev).add(annId));
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!studentProfile) {
    return null;
  }

  const navItems: { id: StudentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'learning', label: 'Syllabus & Materials', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'tests', label: 'Online Tests & Results', icon: FileCheck2 },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'fees', label: 'Fees & Receipts', icon: IndianRupee },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  const unreadAnnouncements = announcements.filter((a) => !readIds.has(a.id)).length;

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Student Portal</p>
            <p className="text-xs font-mono text-slate-600">{studentProfile.rollNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.id === 'announcements' && unreadAnnouncements > 0 && (
                <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
                  {unreadAnnouncements}
                </span>
              )}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
            <Link
              to="/faculty"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              <Users className="w-4 h-4" />
              <span>Public Faculty Contacts</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Institute Website</span>
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={toggleLang}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-200 rounded-lg text-slate-600"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="truncate">
              <p className="text-xs text-slate-500">
                Student Portal / {navItems.find((i) => i.id === tab)?.label}
              </p>
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {studentProfile.name} · {studentProfile.courseName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell onOpenAll={() => setTab('announcements')} />
            <span className="hidden sm:inline text-xs font-mono text-slate-500">
              {studentProfile.academicSession || data.settings.currentSession}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading your academic records...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-blue-700 font-medium">
                        Welcome back · Status: {studentProfile.status}
                      </p>
                      <h2 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
                        {studentProfile.name}
                      </h2>
                      <p className="mt-1 text-xs font-mono text-slate-600">
                        Roll No: {studentProfile.rollNumber} · ID: {studentProfile.studentIdCode} · Batch:{' '}
                        {studentProfile.batchName || 'Assigned at center'}
                      </p>
                    </div>
                    <Link
                      to="/faculty"
                      className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                    >
                      Contact Faculty →
                    </Link>
                  </div>

                  {/* Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Attendance Rate</p>
                      <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {attendanceStats.pct}%
                      </p>
                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        {attendanceStats.present + attendanceStats.late} of {attendanceStats.total} sessions
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Fee Balance Due</p>
                      <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        ₹{primaryFee ? primaryFee.balanceDue.toLocaleString('en-IN') : '0'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Status: {primaryFee?.status || 'Configured by office'}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Tests Completed</p>
                      <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {results.length} / {exams.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Online MCQ exams</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Unread Notices</p>
                      <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-blue-700">
                        {unreadAnnouncements}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Internal portal only</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-slate-900">
                          Latest Internal Announcements
                        </h3>
                        <button
                          type="button"
                          onClick={() => setTab('announcements')}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {announcements.length === 0 ? (
                        <p className="text-sm text-slate-500">No announcements published yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {announcements.slice(0, 4).map((a) => (
                            <div key={a.id} className="py-3">
                              <p className="text-sm font-medium text-slate-900">{a.title}</p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-slate-900">Recent Test Results</h3>
                        <button
                          type="button"
                          onClick={() => setTab('tests')}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Open Tests
                        </button>
                      </div>
                      {results.length === 0 ? (
                        <p className="text-sm text-slate-500">No examinations taken yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {results.slice(0, 4).map((r) => (
                            <div key={r.id} className="py-3 flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-900">{r.examTitle}</span>
                              <span
                                className={`font-mono tabular-nums text-xs font-semibold ${
                                  r.passed ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                {r.score}/{r.totalMarks} ({r.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE */}
              {tab === 'profile' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                      Student Profile
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Academic identity fields (Roll Number, Course, Batch, Status) are controlled by Management. You may update your phone number and residential address below.
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Full Name</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">{studentProfile.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Roll Number</dt>
                      <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                        {studentProfile.rollNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Student ID</dt>
                      <dd className="font-mono text-slate-900 mt-0.5">{studentProfile.studentIdCode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Enrolled Course</dt>
                      <dd className="text-slate-900 mt-0.5">{studentProfile.courseName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Assigned Batch</dt>
                      <dd className="text-slate-900 mt-0.5">
                        {studentProfile.batchName || 'Not assigned yet'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Academic Session</dt>
                      <dd className="font-mono text-slate-900 mt-0.5">
                        {studentProfile.academicSession || data.settings.currentSession}
                      </dd>
                    </div>
                  </dl>

                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Residential Address
                      </label>
                      <textarea
                        rows={3}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                    >
                      {savingProfile ? 'Saving...' : 'Update Permitted Profile Details'}
                    </button>
                  </form>
                </div>
              )}

              {/* LEARNING & STUDY MATERIALS */}
              {tab === 'learning' && (
                <div className="space-y-6">
                  {enrolledCourse && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <p className="text-xs text-blue-700 font-medium">Enrolled Course Syllabus</p>
                      <h2 className="mt-1 font-editorial text-2xl font-semibold text-slate-950">
                        {enrolledCourse.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">{enrolledCourse.description}</p>
                      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700">
                        {(enrolledCourse.syllabusOverview || []).map((topic, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-xs text-blue-700 mt-0.5">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Private Study Materials &amp; Practical Files
                    </h3>
                    {materials.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">
                        No study materials have been uploaded for your course yet.
                      </p>
                    ) : (
                      <div className="mt-4 divide-y divide-slate-200">
                        {materials.map((m) => (
                          <div
                            key={m.id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-xs text-slate-500">
                                {m.moduleName} · {m.fileType.toUpperCase()}
                              </p>
                              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                {m.title}
                              </p>
                              {m.description && (
                                <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                              )}
                            </div>
                            {m.fileUrl && (
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 whitespace-nowrap"
                              >
                                <span>Open Resource</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ASSIGNMENTS */}
              {tab === 'assignments' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                      Course Assignments
                    </h2>
                    {assignments.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">
                        No assignments published for your course yet.
                      </p>
                    ) : (
                      <div className="mt-5 divide-y divide-slate-200">
                        {assignments.map((asg) => {
                          const existingSub = submissions.find((s) => s.assignmentId === asg.id);
                          return (
                            <div key={asg.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-mono text-slate-500">
                                  Due: {asg.dueDate} · Max Marks: {asg.maxMarks}
                                </p>
                                <h3 className="mt-1 text-base font-semibold text-slate-900">
                                  {asg.title}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">{asg.description}</p>
                                {existingSub && (
                                  <div className="mt-2 text-xs text-emerald-700">
                                    Status: {existingSub.status}
                                    {existingSub.marksObtained != null &&
                                      ` · Marks: ${existingSub.marksObtained}/${asg.maxMarks}`}
                                    {existingSub.feedback && ` · Feedback: ${existingSub.feedback}`}
                                  </div>
                                )}
                              </div>
                              {!existingSub && (
                                <button
                                  type="button"
                                  onClick={() => setActiveAssignment(asg)}
                                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap"
                                >
                                  Submit Work
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {activeAssignment && (
                    <form
                      onSubmit={handleSubmitAssignment}
                      className="bg-white border border-blue-200 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">
                          Submit: {activeAssignment.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveAssignment(null)}
                          className="text-xs text-slate-500 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Write your assignment answer or lab work notes..."
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                      <input
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="Optional link to practical file or document"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                      <button
                        type="submit"
                        disabled={submittingAssignment}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                      >
                        {submittingAssignment ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ONLINE MCQ TESTS & RESULTS */}
              {tab === 'tests' && (
                <div className="space-y-6">
                  {activeExam ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <div>
                          <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                            {activeExam.title}
                          </h2>
                          <p className="text-xs font-mono text-slate-500 mt-1">
                            Duration: {activeExam.durationMinutes} min · Total Marks:{' '}
                            {activeExam.totalMarks}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveExam(null)}
                          className="text-xs text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg"
                        >
                          Exit Test
                        </button>
                      </div>

                      <div className="space-y-6">
                        {(activeExam.questions || []).map((q, idx) => (
                          <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-sm font-semibold text-slate-900">
                              Q{idx + 1}. {q.question}{' '}
                              <span className="text-xs font-mono text-slate-500">
                                ({q.marks} marks)
                              </span>
                            </p>
                            <div className="mt-3 space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <label
                                  key={optIdx}
                                  className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    checked={examAnswers[q.id] === optIdx}
                                    onChange={() =>
                                      setExamAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                    }
                                    className="text-blue-700"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={submittingExam}
                        onClick={() => void handleSubmitExam()}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                      >
                        {submittingExam ? 'Evaluating...' : 'Submit Examination & View Score'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                          Available Online MCQ Examinations
                        </h2>
                        {exams.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">
                            No published examinations available at this time.
                          </p>
                        ) : (
                          <div className="mt-4 divide-y divide-slate-200">
                            {exams.map((ex) => {
                              const alreadyTaken = results.find((r) => r.examId === ex.id);
                              return (
                                <div
                                  key={ex.id}
                                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div>
                                    <p className="text-xs font-mono text-slate-500">
                                      Date: {ex.scheduledDate || 'Open'} · {ex.durationMinutes} mins ·{' '}
                                      {ex.questions?.length || 0} Questions
                                    </p>
                                    <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                                      {ex.title}
                                    </h3>
                                  </div>
                                  {alreadyTaken ? (
                                    <span className="text-xs font-mono font-semibold text-emerald-700">
                                      Completed: {alreadyTaken.score}/{alreadyTaken.totalMarks} (
                                      {alreadyTaken.percentage}%)
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveExam(ex);
                                        setExamAnswers({});
                                      }}
                                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                                    >
                                      Start MCQ Test
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Personal Performance Report
                        </h3>
                        {results.length === 0 ? (
                          <p className="mt-3 text-sm text-slate-500">No results recorded yet.</p>
                        ) : (
                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                                  <th className="py-2.5 pr-4">Examination</th>
                                  <th className="py-2.5 px-4 text-right">Score</th>
                                  <th className="py-2.5 px-4 text-right">Percentage</th>
                                  <th className="py-2.5 pl-4">Outcome</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {results.map((r) => (
                                  <tr key={r.id}>
                                    <td className="py-3 pr-4 font-medium text-slate-900">
                                      {r.examTitle}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                                      {r.score} / {r.totalMarks}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                                      {r.percentage}%
                                    </td>
                                    <td
                                      className={`py-3 pl-4 font-medium ${
                                        r.passed ? 'text-emerald-700' : 'text-red-700'
                                      }`}
                                    >
                                      {r.passed ? 'Passed' : 'Needs Improvement'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ATTENDANCE (READ ONLY) */}
              {tab === 'attendance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Attendance %</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {attendanceStats.pct}%
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Present Days</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-emerald-700">
                        {attendanceStats.present}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Late Arrivals</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-amber-700">
                        {attendanceStats.late}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Absent Days</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-red-700">
                        {attendanceStats.absent}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Daily Attendance History (Read-Only)
                    </h2>
                    {attendance.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No attendance entries recorded yet.</p>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                              <th className="py-2.5 pr-4">Date</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 pl-4">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {attendance.map((a) => (
                              <tr key={a.id}>
                                <td className="py-3 pr-4 font-mono tabular-nums text-slate-900">
                                  {a.date}
                                </td>
                                <td
                                  className={`py-3 px-4 font-medium capitalize ${
                                    a.status === 'present'
                                      ? 'text-emerald-700'
                                      : a.status === 'late'
                                        ? 'text-amber-700'
                                        : 'text-red-700'
                                  }`}
                                >
                                  {a.status}
                                </td>
                                <td className="py-3 pl-4 text-slate-600">{a.remarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FEES & RECEIPTS (READ ONLY) */}
              {tab === 'fees' && (
                <div className="space-y-6">
                  {primaryFee ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-5">
                      <div>
                        <p className="text-xs text-slate-500">Course Net Fee</p>
                        <p className="mt-1 text-xl font-mono font-semibold tabular-nums text-slate-950">
                          ₹{primaryFee.netFee.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Paid</p>
                        <p className="mt-1 text-xl font-mono font-semibold tabular-nums text-emerald-700">
                          ₹{primaryFee.amountPaid.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Outstanding Balance</p>
                        <p className="mt-1 text-xl font-mono font-semibold tabular-nums text-amber-700">
                          ₹{primaryFee.balanceDue.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Fee Status / Due Date</p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                          {primaryFee.status} {primaryFee.dueDate ? `· ${primaryFee.dueDate}` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
                      Fee ledger is managed by the institute office and will appear here once linked.
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Payment History &amp; Receipts (Read-Only)
                    </h2>
                    {payments.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No fee payments recorded yet.</p>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                              <th className="py-2.5 pr-4">Receipt No.</th>
                              <th className="py-2.5 px-4">Date</th>
                              <th className="py-2.5 px-4">Mode</th>
                              <th className="py-2.5 px-4 text-right">Amount</th>
                              <th className="py-2.5 pl-4 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payments.map((p) => (
                              <tr key={p.id}>
                                <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-900">
                                  {p.receiptNumber}
                                </td>
                                <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                                  {p.paymentDate}
                                </td>
                                <td className="py-3 px-4 text-slate-700">{p.paymentMode}</td>
                                <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                                  ₹{p.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceipt(p)}
                                    className="text-xs font-medium text-blue-700 hover:underline"
                                  >
                                    View / Print
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CERTIFICATES */}
              {tab === 'certificates' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                    My Certificates
                  </h2>
                  {certificates.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      No completion certificates issued yet. Eligible certificates issued by Management appear here with QR verification.
                    </p>
                  ) : (
                    <div className="mt-5 divide-y divide-slate-200">
                      {certificates.map((c) => (
                        <div
                          key={c.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-xs font-mono text-slate-500">
                              {c.certificateId} · Issued {c.issueDate} · Grade {c.grade}
                            </p>
                            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                              {c.courseName}
                            </h3>
                            <p
                              className={`text-xs font-medium mt-0.5 ${
                                c.status === 'valid' ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              Status: {c.status === 'valid' ? 'Valid & Verifiable' : 'Revoked'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewCert(c)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Download PDF</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INTERNAL ANNOUNCEMENT CENTER */}
              {tab === 'announcements' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                        Student Announcement Center
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Strictly internal website announcements. No external SMS, WhatsApp, or email notifications are dispatched.
                      </p>
                    </div>
                    <input
                      type="search"
                      value={annSearch}
                      onChange={(e) => setAnnSearch(e.target.value)}
                      placeholder="Search announcements..."
                      className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg sm:w-64 focus:outline-none focus:border-blue-700"
                    />
                  </div>

                  <div className="divide-y divide-slate-200">
                    {announcements
                      .filter(
                        (a) =>
                          !annSearch.trim() ||
                          a.title.toLowerCase().includes(annSearch.toLowerCase()) ||
                          a.body.toLowerCase().includes(annSearch.toLowerCase())
                      )
                      .map((a) => {
                        const isRead = readIds.has(a.id);
                        return (
                          <article key={a.id} className="py-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs text-slate-500">
                                  {a.category} · Priority: {a.priority}
                                  {a.isPinned ? ' · Pinned' : ''}
                                  {!isRead ? ' · Unread' : ''}
                                </p>
                                <h3 className="mt-1 text-base font-semibold text-slate-900">
                                  {a.title}
                                </h3>
                              </div>
                              {!isRead && (
                                <button
                                  type="button"
                                  onClick={() => void markAnnouncementRead(a.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 whitespace-nowrap"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Read</span>
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {a.body}
                            </p>
                          </article>
                        );
                      })}
                    {announcements.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">
                        No internal announcements published yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Printable Certificate Modal */}
      {previewCert && (
        <PrintableCertificateModal
          certificate={previewCert}
          settings={data.settings}
          onClose={() => setPreviewCert(null)}
        />
      )}

      {/* Printable Fee Receipt Modal */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-sm font-semibold text-slate-900">Fee Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="font-editorial text-xl font-semibold text-slate-950">
                  {data.settings.instituteName}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{data.settings.address}</p>
                <p className="text-xs font-mono text-slate-600 mt-1">
                  Phone: +91 {data.settings.contactPhone}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Receipt Number</dt>
                  <dd className="font-mono font-semibold text-slate-900">
                    {previewReceipt.receiptNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Payment Date</dt>
                  <dd className="font-mono text-slate-900">{previewReceipt.paymentDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Student Name</dt>
                  <dd className="font-medium text-slate-900">{previewReceipt.studentName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Roll Number</dt>
                  <dd className="font-mono text-slate-900">{previewReceipt.rollNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Payment Mode</dt>
                  <dd className="text-slate-900">{previewReceipt.paymentMode}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Amount Paid</dt>
                  <dd className="font-mono text-lg font-semibold text-emerald-700">
                    ₹{previewReceipt.amount.toLocaleString('en-IN')}
                  </dd>
                </div>
              </dl>
              {previewReceipt.remarks && (
                <p className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                  Remarks: {previewReceipt.remarks}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
