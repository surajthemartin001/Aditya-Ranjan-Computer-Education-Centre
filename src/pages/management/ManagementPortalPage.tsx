import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
  UserCog,
  BookOpen,
  Calendar,
  CalendarCheck,
  FolderOpen,
  ClipboardList,
  FileCheck2,
  IndianRupee,
  BarChart3,
  Award,
  Megaphone,
  Globe,
  Image as ImageIcon,
  Shield,
  LogOut,
  ExternalLink,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import { NotificationBell } from '../../components/NotificationBell';
import {
  listCollection,
  seedVerifiedInstituteData,
  type ActivityLog,
  type AdmissionApplication,
  type Announcement,
  type Assignment,
  type AssignmentSubmission,
  type AttendanceRecord,
  type Batch,
  type CertificateRecord,
  type Course,
  type Enquiry,
  type Examination,
  type ExamResult,
  type FeeRecord,
  type FinancialTransaction,
  type GalleryMedia,
  type Payment,
  type PublicFaculty,
  type PublicNotice,
  type StaffProfile,
  type StudentProfile,
  type StudyMaterial,
} from '../../services/firestoreService';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';
import { AdmissionsAndStudentsSection } from './sections/AdmissionsAndStudentsSection';
import { TeachersAndCoursesSection } from './sections/TeachersAndCoursesSection';
import { AcademicAndExamSection } from './sections/AcademicAndExamSection';
import { FeesFinanceCertsSection } from './sections/FeesFinanceCertsSection';
import { CmsMediaAnnouncementsSection } from './sections/CmsMediaAnnouncementsSection';

type MgmtTab =
  | 'overview'
  | 'enquiries'
  | 'admissions'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'batches'
  | 'attendance'
  | 'materials'
  | 'assignments'
  | 'exams'
  | 'fees'
  | 'financials'
  | 'certificates'
  | 'announcements'
  | 'cms'
  | 'media'
  | 'audit';

export function ManagementPortalPage({ data }: { data: PublicInstituteState }) {
  const { firebaseUser, staffProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<MgmtTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [publicFaculty, setPublicFaculty] = useState<PublicFaculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [publicNotices, setPublicNotices] = useState<PublicNotice[]>([]);
  const [gallery, setGallery] = useState<GalleryMedia[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const safe = async <T,>(col: string): Promise<T[]> => {
        try {
          return await listCollection<T>(col);
        } catch {
          return [];
        }
      };

      const [
        enq,
        app,
        stu,
        stf,
        pubFac,
        crs,
        bat,
        att,
        mat,
        asg,
        sub,
        exm,
        res,
        fee,
        pay,
        tx,
        crt,
        ann,
        pubN,
        gal,
        logs,
      ] = await Promise.all([
        safe<Enquiry>('enquiries'),
        safe<AdmissionApplication>('admissionApplications'),
        safe<StudentProfile>('studentProfiles'),
        safe<StaffProfile>('staffProfiles'),
        safe<PublicFaculty>('publicFaculty'),
        safe<Course>('courses'),
        safe<Batch>('batches'),
        safe<AttendanceRecord>('attendance'),
        safe<StudyMaterial>('studyMaterials'),
        safe<Assignment>('assignments'),
        safe<AssignmentSubmission>('assignmentSubmissions'),
        safe<Examination>('examinations'),
        safe<ExamResult>('results'),
        safe<FeeRecord>('feeRecords'),
        safe<Payment>('payments'),
        safe<FinancialTransaction>('financialTransactions'),
        safe<CertificateRecord>('certificates'),
        safe<Announcement>('announcements'),
        safe<PublicNotice>('publicNotices'),
        safe<GalleryMedia>('galleryMedia'),
        safe<ActivityLog>('activityLogs'),
      ]);

      setEnquiries(enq);
      setApplications(app);
      setStudents(stu);
      setStaff(stf);
      setPublicFaculty(pubFac.length ? pubFac : data.faculty);
      setCourses(crs.length ? crs : data.courses);
      setBatches(bat.length ? bat : data.batches);
      setAttendance(att);
      setMaterials(mat);
      setAssignments(asg);
      setSubmissions(sub);
      setExams(exm);
      setResults(res);
      setFeeRecords(fee);
      setPayments(pay);
      setTransactions(tx);
      setCertificates(crt);
      setAnnouncements(ann);
      setPublicNotices(pubN.length ? pubN : data.notices);
      setGallery(gal.length ? gal : data.gallery);
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  }, [data.batches, data.courses, data.faculty, data.gallery, data.notices]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefreshAll = async () => {
    await Promise.all([loadAll(), data.refresh()]);
  };

  const handleSeedDatabase = async () => {
    if (!firebaseUser) return;
    setSeeding(true);
    try {
      await seedVerifiedInstituteData(
        firebaseUser.uid,
        staffProfile?.name || 'Managing Director'
      );
      showToast('Verified institute records initialized in Firestore!', 'success');
      await handleRefreshAll();
    } catch {
      showToast('Could not seed initial records.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeStudents = students.filter((s) => s.status === 'active' || s.status === 'approved').length;
  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const todayAttCount = attendance.filter((a) => a.date === today && a.status === 'present').length;
  const totalFeeCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingFees = feeRecords.reduce((sum, f) => sum + Number(f.balanceDue || 0), 0);

  const navGroups: {
    heading: string;
    items: { id: MgmtTab; label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      heading: 'Overview & Admissions',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: MessageSquare },
        { id: 'admissions', label: `Applications (${pendingApps})`, icon: FileText },
        { id: 'students', label: `Students (${students.length})`, icon: Users },
      ],
    },
    {
      heading: 'Faculty & Programs',
      items: [
        { id: 'teachers', label: 'Teachers & Permissions', icon: UserCog },
        { id: 'courses', label: 'Courses Management', icon: BookOpen },
        { id: 'batches', label: 'Batches & Timetable', icon: Calendar },
      ],
    },
    {
      heading: 'Academics & Exams',
      items: [
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'materials', label: 'Study Materials', icon: FolderOpen },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'exams', label: 'Exams & Results', icon: FileCheck2 },
      ],
    },
    {
      heading: 'Finance & Certificates',
      items: [
        { id: 'fees', label: 'Fees & Receipts', icon: IndianRupee },
        { id: 'financials', label: 'Income & Expenses', icon: BarChart3 },
        { id: 'certificates', label: 'Certificates & QR', icon: Award },
      ],
    },
    {
      heading: 'Website & Governance',
      items: [
        { id: 'announcements', label: 'Announcements & Notices', icon: Megaphone },
        { id: 'cms', label: 'Website CMS & Settings', icon: Globe },
        { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
        { id: 'audit', label: 'Audit Activity Logs', icon: Shield },
      ],
    },
  ];

  const actorUid = firebaseUser?.uid || '';
  const actorName = staffProfile?.name || 'Managing Director';

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-200 flex flex-col transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-400">Management Portal</p>
            <p className="text-xs text-slate-400 truncate max-w-[170px]">{actorName}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.heading}>
              <p className="px-3 text-[11px] font-medium text-slate-500 mb-1.5">{group.heading}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      tab === item.id
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 border border-slate-800 rounded-lg hover:bg-slate-900"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-300 border border-red-900/60 rounded-lg hover:bg-red-950/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-200 rounded-lg text-slate-600"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-slate-500">
                Aditya Ranjan Computer Education Center / Management
              </p>
              <h1 className="text-sm font-semibold text-slate-900 capitalize">
                {tab === 'cms' ? 'Website CMS & Settings' : tab}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!data.isSeeded && (
              <button
                type="button"
                disabled={seeding}
                onClick={() => void handleSeedDatabase()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seeding ? 'Initializing...' : 'Initialize Verified Data in Firestore'}</span>
              </button>
            )}
            <NotificationBell onOpenAll={() => setTab('announcements')} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading live institutional records from Firestore...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  {!data.isSeeded && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-blue-950">
                          First-Time Database Initialization
                        </p>
                        <p className="text-xs text-blue-900 mt-1">
                          Save the verified ADCA, DCA, Tally, DTA, Typing courses, timetable slots, Ajay Kumar faculty profile, gallery metadata, and institute settings into your live Firestore database so CMS edits persist immediately.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={seeding}
                        onClick={() => void handleSeedDatabase()}
                        className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap"
                      >
                        {seeding ? 'Saving to Firestore...' : 'Initialize Firestore Records'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Students', val: students.length, sub: `${activeStudents} active/approved` },
                      { label: 'Pending Applications', val: pendingApps, sub: `${applications.length} total submitted` },
                      { label: 'Public Enquiries', val: enquiries.length, sub: 'Awaiting review' },
                      { label: 'Active Courses & Batches', val: `${courses.length} / ${batches.length}`, sub: 'Published catalog' },
                      { label: 'Today Present', val: todayAttCount, sub: today },
                      { label: 'Fee Collected', val: `₹${totalFeeCollected.toLocaleString('en-IN')}`, sub: `${payments.length} receipts` },
                      { label: 'Pending Fees', val: `₹${pendingFees.toLocaleString('en-IN')}`, sub: `${feeRecords.length} ledgers` },
                      { label: 'Certificates Issued', val: certificates.length, sub: 'QR verifiable' },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs text-slate-500">{kpi.label}</p>
                        <p className="mt-1.5 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                          {kpi.val}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900">
                          Recent Admission Applications
                        </h2>
                        <button
                          type="button"
                          onClick={() => setTab('admissions')}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Manage Admissions →
                        </button>
                      </div>
                      {applications.length === 0 ? (
                        <p className="text-sm text-slate-500">No admission applications yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 text-sm">
                          {applications.slice(0, 5).map((a) => (
                            <div key={a.id} className="py-2.5 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{a.fullName}</p>
                                <p className="text-xs text-slate-500">{a.selectedCourseName}</p>
                              </div>
                              <span className="text-xs font-mono capitalize text-amber-700">
                                {a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900">
                          Recent Audit Activity
                        </h2>
                        <button
                          type="button"
                          onClick={() => setTab('audit')}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Full Audit Log →
                        </button>
                      </div>
                      {auditLogs.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Administrative actions will be recorded here automatically.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                          {auditLogs.slice(0, 6).map((log) => (
                            <div key={log.id} className="py-2.5">
                              <p className="font-semibold text-slate-900">
                                {log.action} · <span className="font-normal text-slate-500">{log.module}</span>
                              </p>
                              <p className="text-slate-600 mt-0.5">{log.details}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(tab === 'enquiries' || tab === 'admissions' || tab === 'students') && (
                <AdmissionsAndStudentsSection
                  subTab={tab}
                  enquiries={enquiries}
                  applications={applications}
                  students={students}
                  courses={courses}
                  batches={batches}
                  currentSession={data.settings.currentSession}
                  actorUid={actorUid}
                  actorName={actorName}
                  onRefresh={handleRefreshAll}
                />
              )}

              {(tab === 'teachers' || tab === 'courses' || tab === 'batches') && (
                <TeachersAndCoursesSection
                  subTab={tab}
                  staff={staff}
                  publicFaculty={publicFaculty}
                  courses={courses}
                  batches={batches}
                  actorUid={actorUid}
                  actorName={actorName}
                  onRefresh={handleRefreshAll}
                />
              )}

              {(tab === 'attendance' ||
                tab === 'materials' ||
                tab === 'assignments' ||
                tab === 'exams') && (
                <AcademicAndExamSection
                  subTab={tab}
                  students={students}
                  courses={courses}
                  attendance={attendance}
                  materials={materials}
                  assignments={assignments}
                  submissions={submissions}
                  exams={exams}
                  results={results}
                  actorUid={actorUid}
                  actorName={actorName}
                  actorRole="managing_director"
                  canPublishTests={true}
                  onRefresh={handleRefreshAll}
                />
              )}

              {(tab === 'fees' || tab === 'financials' || tab === 'certificates') && (
                <FeesFinanceCertsSection
                  subTab={tab}
                  students={students}
                  feeRecords={feeRecords}
                  payments={payments}
                  transactions={transactions}
                  certificates={certificates}
                  settings={data.settings}
                  actorUid={actorUid}
                  actorName={actorName}
                  onRefresh={handleRefreshAll}
                />
              )}

              {(tab === 'announcements' || tab === 'cms' || tab === 'media') && (
                <CmsMediaAnnouncementsSection
                  subTab={tab}
                  announcements={announcements}
                  publicNotices={publicNotices}
                  gallery={gallery}
                  settings={data.settings}
                  content={data.content}
                  courses={courses}
                  batches={batches}
                  actorUid={actorUid}
                  actorName={actorName}
                  onRefresh={handleRefreshAll}
                />
              )}

              {tab === 'audit' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Security &amp; Administrative Audit Log ({auditLogs.length})
                  </h2>
                  <div className="divide-y divide-slate-100 text-sm">
                    {auditLogs.map((l) => (
                      <div key={l.id} className="py-3">
                        <p className="text-xs font-mono text-blue-700 font-semibold">
                          {l.action} · {l.module} · by {l.actorName} ({l.actorRole})
                        </p>
                        <p className="text-slate-700 mt-0.5 text-sm">{l.details}</p>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">
                        No audit events recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
