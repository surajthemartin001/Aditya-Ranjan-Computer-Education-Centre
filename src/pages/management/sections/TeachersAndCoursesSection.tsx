import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import {
  logActivity,
  makeSafeId,
  normalizeEmailKey,
  removeDocument,
  saveDocument,
} from '../../../services/firestoreService';
import { INSTITUTE_IMAGES } from '../../../data/verifiedDefaults';
import { useToast } from '../../../components/ToastContext';
import type {
  Batch,
  Course,
  PublicFaculty,
  StaffProfile,
  StaffRole,
  TeacherPermissions,
} from '../../../types/models';

interface Props {
  subTab: 'teachers' | 'courses' | 'batches';
  staff: StaffProfile[];
  publicFaculty: PublicFaculty[];
  courses: Course[];
  batches: Batch[];
  actorUid: string;
  actorName: string;
  onRefresh: () => Promise<void>;
}

const DEFAULT_TEACHER_PERMS: TeacherPermissions = {
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

export function TeachersAndCoursesSection({
  subTab,
  staff,
  publicFaculty,
  courses,
  batches,
  actorUid,
  actorName,
  onRefresh,
}: Props) {
  const { showToast, confirmAction } = useToast();

  // Invite / Add Staff form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('teacher');
  const [staffDesig, setStaffDesig] = useState('Computer Instructor');
  const [staffQual, setStaffQual] = useState('');
  const [perms, setPerms] = useState<TeacherPermissions>(DEFAULT_TEACHER_PERMS);
  const [publishPublicFaculty, setPublishPublicFaculty] = useState(true);
  const [showPublicPhone, setShowPublicPhone] = useState(false);
  const [showPublicEmail, setShowPublicEmail] = useState(false);

  // Course editor form
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [cCode, setCCode] = useState('');
  const [cName, setCName] = useState('');
  const [cDuration, setCDuration] = useState('');
  const [cFeeLabel, setCFeeLabel] = useState('');
  const [cFeeAmount, setCFeeAmount] = useState('');
  const [cFeeNote, setCFeeNote] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cSyllabusText, setCSyllabusText] = useState('');
  const [cPublished, setCPublished] = useState(true);
  const [cActive, setCActive] = useState(true);

  // Batch / Timetable editor form
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bCourseCode, setBCourseCode] = useState('ADCA');
  const [bTheory, setBTheory] = useState('');
  const [bPractical, setBPractical] = useState('');
  const [bClassroom, setBClassroom] = useState('Main Hall & Computer Lab');
  const [bNote, setBNote] = useState('');
  const [bPublic, setBPublic] = useState(true);

  const handleSaveStaffInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailKey = normalizeEmailKey(staffEmail);
    try {
      await saveDocument('staffInvites', emailKey, {
        email: staffEmail.trim().toLowerCase(),
        phone: staffPhone.trim(),
        name: staffName.trim(),
        role: staffRole,
        designation: staffDesig.trim(),
        qualification: staffQual.trim(),
        assignedCourseIds: [],
        assignedBatchIds: [],
        permissions: perms,
        isActive: true,
        claimedUid: '',
      });

      if (publishPublicFaculty) {
        const pubId = `faculty-${emailKey}`;
        await saveDocument('publicFaculty', pubId, {
          name: staffName.trim(),
          designation: staffDesig.trim(),
          qualification: staffQual.trim() || 'Faculty',
          subjectsTaught: [],
          bio: `${staffDesig.trim()} at Aditya Ranjan Computer Education Center.`,
          photoUrl: INSTITUTE_IMAGES.director,
          publicPhone: showPublicPhone ? staffPhone.trim() : '',
          publicEmail: showPublicEmail ? staffEmail.trim().toLowerCase() : '',
          showPublicPhone,
          showPublicEmail,
          isPublished: true,
          displayOrder: publicFaculty.length + 1,
        });
      }

      await logActivity({
        action: 'PROVISION_STAFF_ACCOUNT',
        module: 'Teachers',
        actorUid,
        actorName,
        actorRole: 'managing_director',
        targetId: emailKey,
        details: `Provisioned ${staffRole} access for ${staffName} (${staffEmail}).`,
      });

      showToast(
        `Staff access provisioned for ${staffName}. They can now sign in via Staff Login with ${staffEmail}.`,
        'success'
      );
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffQual('');
      await onRefresh();
    } catch {
      showToast('Failed to provision staff account.', 'error');
    }
  };

  const togglePublicContact = async (
    fac: PublicFaculty,
    field: 'showPublicPhone' | 'showPublicEmail' | 'isPublished'
  ) => {
    try {
      await saveDocument('publicFaculty', fac.id, { [field]: !fac[field] });
      showToast('Updated public faculty visibility.', 'success');
      await onRefresh();
    } catch {
      showToast('Failed to update faculty settings.', 'error');
    }
  };

  const loadCourseIntoForm = (c: Course) => {
    setEditingCourseId(c.id);
    setCCode(c.code);
    setCName(c.name);
    setCDuration(c.duration);
    setCFeeLabel(c.feeLabel);
    setCFeeAmount(c.feeAmount ? String(c.feeAmount) : '');
    setCFeeNote(c.feeNote || '');
    setCDesc(c.description);
    setCSyllabusText((c.syllabusOverview || []).join('\n'));
    setCPublished(c.isPublished);
    setCActive(c.isActive);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingCourseId || makeSafeId('course');
    try {
      await saveDocument('courses', id, {
        code: cCode.trim().toUpperCase(),
        name: cName.trim(),
        duration: cDuration.trim(),
        feeLabel: cFeeLabel.trim(),
        feeAmount: cFeeAmount ? Number(cFeeAmount) : 0,
        feeNote: cFeeNote.trim(),
        description: cDesc.trim(),
        syllabusOverview: cSyllabusText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 30),
        outcomes: ['Structured classroom theory & daily practical lab work'],
        imageUrl: INSTITUTE_IMAGES.adca,
        isPublished: cPublished,
        isActive: cActive,
        displayOrder: editingCourseId ? 1 : courses.length + 1,
      });
      await logActivity({
        action: editingCourseId ? 'UPDATE_COURSE' : 'CREATE_COURSE',
        module: 'Courses',
        actorUid,
        actorName,
        actorRole: 'managing_director',
        targetId: id,
        details: `Saved course ${cCode} (${cName}) — ${cFeeLabel}, Published: ${cPublished}.`,
      });
      showToast('Course saved to Firestore and synced with public website.', 'success');
      setEditingCourseId(null);
      setCCode('');
      setCName('');
      setCDuration('');
      setCFeeLabel('');
      setCFeeAmount('');
      setCDesc('');
      setCSyllabusText('');
      await onRefresh();
    } catch {
      showToast('Could not save course.', 'error');
    }
  };

  const loadBatchIntoForm = (b: Batch) => {
    setEditingBatchId(b.id);
    setBName(b.name);
    setBCourseCode(b.courseCode);
    setBTheory(b.theoryTime);
    setBPractical(b.practicalTime);
    setBClassroom(b.classroom || '');
    setBNote(b.scheduleNote || '');
    setBPublic(b.isPublicTimetable);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingBatchId || makeSafeId('batch');
    const matchedCourse = courses.find((c) => c.code === bCourseCode);
    try {
      await saveDocument('batches', id, {
        name: bName.trim(),
        courseId: matchedCourse?.id || '',
        courseCode: bCourseCode.trim().toUpperCase(),
        theoryTime: bTheory.trim() || 'To be configured',
        practicalTime: bPractical.trim() || 'To be configured',
        classroom: bClassroom.trim(),
        scheduleNote: bNote.trim(),
        isPublicTimetable: bPublic,
        displayOrder: editingBatchId ? 1 : batches.length + 1,
      });
      showToast('Batch & timetable saved.', 'success');
      setEditingBatchId(null);
      setBName('');
      setBTheory('');
      setBPractical('');
      setBNote('');
      await onRefresh();
    } catch {
      showToast('Could not save batch.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* TEACHERS & STAFF */}
      {subTab === 'teachers' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveStaffInvite}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Add / Provision Teacher or Staff Account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure exact role &amp; granular Teacher permissions. Invited staff sign in via Staff Login with their registered email.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Teacher Full Name *"
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="Registered Login Email *"
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="tel"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="Phone Number"
                className="px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="teacher">Teacher</option>
                <option value="head_teacher">Head Teacher</option>
                <option value="staff">Authorized Staff</option>
              </select>
              <input
                type="text"
                value={staffDesig}
                onChange={(e) => setStaffDesig(e.target.value)}
                placeholder="Designation (e.g., Senior Instructor)"
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={staffQual}
                onChange={(e) => setStaffQual(e.target.value)}
                placeholder="Qualification (e.g., BCA, MCA)"
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Assigned Teacher Portal Permissions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                {(Object.keys(perms) as (keyof TeacherPermissions)[]).map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perms[key]}
                      onChange={(e) => setPerms((p) => ({ ...p, [key]: e.target.checked }))}
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={publishPublicFaculty}
                  onChange={(e) => setPublishPublicFaculty(e.target.checked)}
                />
                <span>Publish on Public Faculty Page</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPublicPhone}
                  onChange={(e) => setShowPublicPhone(e.target.checked)}
                />
                <span>Display Public Phone</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPublicEmail}
                  onChange={(e) => setShowPublicEmail(e.target.checked)}
                />
                <span>Display Public Email</span>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Teacher Account</span>
            </button>
          </form>

          {/* Public Faculty Visibility Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Public Faculty Directory &amp; Contact Visibility ({publicFaculty.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control strictly which teacher details and phone/email links appear on the public /faculty page.
            </p>
            <div className="mt-4 divide-y divide-slate-200">
              {publicFaculty.map((fac) => (
                <div
                  key={fac.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {fac.name} · <span className="font-normal text-slate-600">{fac.designation}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {fac.publicPhone || 'No phone'} · {fac.publicEmail || 'No email'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => void togglePublicContact(fac, 'showPublicPhone')}
                      className={`px-2.5 py-1 rounded border ${
                        fac.showPublicPhone
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      Phone: {fac.showPublicPhone ? 'Public' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void togglePublicContact(fac, 'showPublicEmail')}
                      className={`px-2.5 py-1 rounded border ${
                        fac.showPublicEmail
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      Email: {fac.showPublicEmail ? 'Public' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void togglePublicContact(fac, 'isPublished')}
                      className={`px-2.5 py-1 rounded border ${
                        fac.isPublished
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {fac.isPublished ? 'Published' : 'Unpublished'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Staff Records */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Active Staff Accounts ({staff.length})
            </h3>
            {staff.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Invited teachers appear here once they complete their first Staff Login.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 text-sm">
                {staff.map((st) => (
                  <div key={st.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {st.name} · <span className="text-xs text-blue-700 capitalize">{st.role.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-slate-500">{st.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await saveDocument('staffProfiles', st.id, { isActive: !st.isActive });
                        showToast(`Account ${st.isActive ? 'deactivated' : 'activated'}.`, 'info');
                        await onRefresh();
                      }}
                      className="text-xs px-3 py-1 border border-slate-300 rounded-lg"
                    >
                      {st.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COURSES */}
      {subTab === 'courses' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveCourse}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCourseId ? 'Edit Course' : 'Add New Course'}
              </h2>
              {editingCourseId && (
                <button
                  type="button"
                  onClick={() => setEditingCourseId(null)}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                placeholder="Code (e.g., ADCA)"
                className="px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Full Course Title"
                className="sm:col-span-3 px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={cDuration}
                onChange={(e) => setCDuration(e.target.value)}
                placeholder="Duration (e.g., 6 Months)"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                value={cFeeLabel}
                onChange={(e) => setCFeeLabel(e.target.value)}
                placeholder="Public Fee Label (e.g., ₹7,999)"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                value={cFeeAmount}
                onChange={(e) => setCFeeAmount(e.target.value)}
                placeholder="Numeric Fee (for ledger)"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <input
              type="text"
              value={cFeeNote}
              onChange={(e) => setCFeeNote(e.target.value)}
              placeholder="Editable fee description note (optional)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <textarea
              rows={2}
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="Course description..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <textarea
              rows={3}
              value={cSyllabusText}
              onChange={(e) => setCSyllabusText(e.target.value)}
              placeholder="Syllabus overview topics (one per line)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cPublished}
                  onChange={(e) => setCPublished(e.target.checked)}
                />
                <span>Published on Public Website</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cActive}
                  onChange={(e) => setCActive(e.target.checked)}
                />
                <span>Active Course</span>
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingCourseId ? 'Update Course' : 'Save New Course'}</span>
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Configured Courses ({courses.length})
            </h3>
            <div className="divide-y divide-slate-200">
              {courses.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.code} — {c.name}
                    </p>
                    <p className="text-xs font-mono text-slate-500">
                      {c.duration} · {c.feeLabel} · {c.isPublished ? 'Published' : 'Hidden'} ·{' '}
                      {c.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadCourseIntoForm(c)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: 'Delete Course?',
                          message: `Delete ${c.name} permanently?`,
                          destructive: true,
                        });
                        if (ok) {
                          await removeDocument('courses', c.id);
                          showToast('Course removed.', 'info');
                          await onRefresh();
                        }
                      }}
                      className="p-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BATCHES & TIMETABLE */}
      {subTab === 'batches' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveBatch}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingBatchId ? 'Edit Batch & Timetable Slot' : 'Add Batch / Timetable Slot'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                placeholder="Batch Name (e.g., ADCA Batch 1)"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                value={bCourseCode}
                onChange={(e) => setBCourseCode(e.target.value)}
                placeholder="Course Code (e.g., ADCA)"
                className="px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={bClassroom}
                onChange={(e) => setBClassroom(e.target.value)}
                placeholder="Classroom / Lab"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={bTheory}
                onChange={(e) => setBTheory(e.target.value)}
                placeholder="Theory Time (e.g., 6:30 AM – 7:30 AM)"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={bPractical}
                onChange={(e) => setBPractical(e.target.value)}
                placeholder="Practical Time (e.g., 7:30 AM – 8:30 AM)"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <input
              type="text"
              value={bNote}
              onChange={(e) => setBNote(e.target.value)}
              placeholder="Schedule note (optional)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={bPublic}
                onChange={(e) => setBPublic(e.target.checked)}
              />
              <span>Publish on Public Timetable page</span>
            </label>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              {editingBatchId ? 'Update Timetable Slot' : 'Save Batch Slot'}
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Configured Batches &amp; Timetable ({batches.length})
            </h3>
            <div className="divide-y divide-slate-200 text-sm">
              {batches.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {b.name} · <span className="font-mono text-xs text-slate-500">{b.courseCode}</span>
                    </p>
                    <p className="text-xs font-mono text-slate-600">
                      Theory: {b.theoryTime} · Practical: {b.practicalTime} ·{' '}
                      {b.isPublicTimetable ? 'Public' : 'Internal Only'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadBatchIntoForm(b)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeDocument('batches', b.id);
                        showToast('Batch deleted.', 'info');
                        await onRefresh();
                      }}
                      className="p-1.5 text-red-600 border border-red-200 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
