import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  FolderOpen,
  ClipboardList,
  FileCheck2,
  Megaphone,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../../components/NotificationBell';
import {
  listCollection,
  makeSafeId,
  saveDocument,
  type Announcement,
  type Assignment,
  type AssignmentSubmission,
  type AttendanceRecord,
  type Batch,
  type Course,
  type Examination,
  type ExamResult,
  type StudentProfile,
  type StudyMaterial,
} from '../../services/firestoreService';
import { AcademicAndExamSection } from '../management/sections/AcademicAndExamSection';
import { useToast } from '../../components/ToastContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

type TeacherTab =
  | 'overview'
  | 'students'
  | 'timetable'
  | 'attendance'
  | 'materials'
  | 'assignments'
  | 'exams'
  | 'announcements';

export function TeacherPortalPage({ data }: { data: PublicInstituteState }) {
  const { firebaseUser, staffProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TeacherTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const perms = staffProfile?.permissions || {
    viewStudents: true,
    markAttendance: true,
    editAttendance: false,
    uploadMaterials: true,
    createAssignments: true,
    createTests: true,
    publishTests: false,
    viewResults: true,
    publishAnnouncements: false,
  };

  const loadTeacherData = useCallback(async () => {
    setLoading(true);
    try {
      const safe = async <T,>(col: string): Promise<T[]> => {
        try {
          return await listCollection<T>(col);
        } catch {
          return [];
        }
      };

      const [stu, crs, bat, att, mat, asg, sub, exm, res, ann] = await Promise.all([
        perms.viewStudents ? safe<StudentProfile>('studentProfiles') : Promise.resolve([]),
        safe<Course>('courses'),
        safe<Batch>('batches'),
        perms.markAttendance ? safe<AttendanceRecord>('attendance') : Promise.resolve([]),
        safe<StudyMaterial>('studyMaterials'),
        safe<Assignment>('assignments'),
        perms.createAssignments
          ? safe<AssignmentSubmission>('assignmentSubmissions')
          : Promise.resolve([]),
        safe<Examination>('examinations'),
        perms.viewResults ? safe<ExamResult>('results') : Promise.resolve([]),
        safe<Announcement>('announcements'),
      ]);

      setStudents(stu);
      setCourses(crs.length ? crs : data.courses);
      setBatches(bat.length ? bat : data.batches);
      setAttendance(att);
      setMaterials(mat);
      setAssignments(asg);
      setSubmissions(sub);
      setExams(exm);
      setResults(res);
      setAnnouncements(ann.filter((a) => a.status === 'published'));
    } finally {
      setLoading(false);
    }
  }, [
    data.batches,
    data.courses,
    perms.createAssignments,
    perms.markAttendance,
    perms.viewResults,
    perms.viewStudents,
  ]);

  useEffect(() => {
    void loadTeacherData();
  }, [loadTeacherData]);

  const handlePublishBatchAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !perms.publishAnnouncements) return;
    const id = makeSafeId('ANN');
    try {
      await saveDocument('announcements', id, {
        title: annTitle.trim(),
        body: annBody.trim(),
        category: 'Batch Update',
        priority: 'normal',
        audience: 'all_students',
        isPinned: false,
        status: 'published',
        createdBy: firebaseUser.uid,
      });
      showToast('Internal batch announcement published inside portal.', 'success');
      setAnnTitle('');
      setAnnBody('');
      await loadTeacherData();
    } catch {
      showToast('Insufficient permission to publish announcements.', 'error');
    }
  };

  const navItems: {
    id: TeacherTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    allowed: boolean;
  }[] = [
    { id: 'overview', label: 'Teacher Overview', icon: LayoutDashboard, allowed: true },
    { id: 'students', label: 'Assigned Students', icon: Users, allowed: perms.viewStudents },
    { id: 'timetable', label: 'My Timetable', icon: Calendar, allowed: true },
    { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck, allowed: perms.markAttendance },
    { id: 'materials', label: 'Study Materials', icon: FolderOpen, allowed: perms.uploadMaterials },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, allowed: perms.createAssignments },
    { id: 'exams', label: 'Tests & Results', icon: FileCheck2, allowed: perms.createTests || perms.viewResults },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, allowed: true },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 capitalize">
              {staffProfile?.role?.replace('_', ' ') || 'Teacher'} Portal
            </p>
            <p className="text-xs text-slate-600 truncate max-w-[165px]">
              {staffProfile?.name || 'Faculty'}
            </p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((i) => i.allowed)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  tab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Website</span>
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-200 rounded-lg"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-slate-500">Faculty Workspace</p>
              <h1 className="text-sm font-semibold text-slate-900">
                {staffProfile?.name} · {staffProfile?.designation}
              </h1>
            </div>
          </div>
          <NotificationBell onOpenAll={() => setTab('announcements')} />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading authorized faculty workspace...
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                      Welcome, {staffProfile?.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Permissions are governed strictly by Management configuration and enforced in Firestore security rules.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Authorized Students</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {students.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Active Batches</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {batches.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Published Materials</p>
                      <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                        {materials.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'students' && perms.viewStudents && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Students Roster ({students.length})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                          <th className="py-2 pr-4">Roll No.</th>
                          <th className="py-2 px-3">Student</th>
                          <th className="py-2 px-3">Course</th>
                          <th className="py-2 pl-3">Batch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td className="py-3 pr-4 font-mono text-xs font-semibold">{s.rollNumber}</td>
                            <td className="py-3 px-3 font-medium text-slate-900">{s.name}</td>
                            <td className="py-3 px-3 text-slate-700">{s.courseName}</td>
                            <td className="py-3 pl-3 text-slate-600">{s.batchName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'timetable' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Teaching Timetable</h2>
                  <div className="divide-y divide-slate-200 text-sm">
                    {batches.map((b) => (
                      <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{b.name}</p>
                          <p className="text-xs text-slate-500">{b.classroom}</p>
                        </div>
                        <p className="text-xs font-mono text-slate-700">
                          Theory: {b.theoryTime} · Practical: {b.practicalTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
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
                  actorUid={firebaseUser?.uid || ''}
                  actorName={staffProfile?.name || 'Teacher'}
                  actorRole={staffProfile?.role || 'teacher'}
                  canPublishTests={perms.publishTests}
                  onRefresh={loadTeacherData}
                />
              )}

              {tab === 'announcements' && (
                <div className="space-y-6">
                  {perms.publishAnnouncements && (
                    <form
                      onSubmit={handlePublishBatchAnnouncement}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
                    >
                      <h2 className="text-base font-semibold text-slate-900">
                        Publish Internal Batch Announcement
                      </h2>
                      <input
                        type="text"
                        required
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="Announcement title"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={3}
                        required
                        value={annBody}
                        onChange={(e) => setAnnBody(e.target.value)}
                        placeholder="Announcement details (internal website only)..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg"
                      >
                        Publish Internally
                      </button>
                    </form>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-3">
                      Internal Staff &amp; Academic Announcements
                    </h3>
                    <div className="divide-y divide-slate-200 text-sm">
                      {announcements.map((a) => (
                        <div key={a.id} className="py-3">
                          <p className="font-medium text-slate-900">{a.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{a.body}</p>
                        </div>
                      ))}
                    </div>
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
