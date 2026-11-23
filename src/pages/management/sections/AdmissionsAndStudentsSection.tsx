import React, { useState } from 'react';
import { CheckCircle2, Download, Plus, UserCheck, XCircle } from 'lucide-react';
import {
  approveApplicationAndCreateStudent,
  createDirectStudentRecord,
  exportToCsv,
  updateDocument,
  updateStudentStatus,
} from '../../../services/firestoreService';
import { useToast } from '../../../components/ToastContext';
import type {
  AdmissionApplication,
  Batch,
  Course,
  Enquiry,
  StudentProfile,
} from '../../../types/models';

interface Props {
  subTab: 'enquiries' | 'admissions' | 'students';
  enquiries: Enquiry[];
  applications: AdmissionApplication[];
  students: StudentProfile[];
  courses: Course[];
  batches: Batch[];
  currentSession: string;
  actorUid: string;
  actorName: string;
  onRefresh: () => Promise<void>;
}

export function AdmissionsAndStudentsSection({
  subTab,
  enquiries,
  applications,
  students,
  courses,
  batches,
  currentSession,
  actorUid,
  actorName,
  onRefresh,
}: Props) {
  const { showToast, confirmAction } = useToast();

  // Approve modal state
  const [reviewingApp, setReviewingApp] = useState<AdmissionApplication | null>(null);
  const [assignCourseId, setAssignCourseId] = useState(courses[0]?.id || 'course-adca');
  const [assignBatchId, setAssignBatchId] = useState(batches[0]?.id || '');
  const [assignSession, setAssignSession] = useState(currentSession);
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [internalNotes, setInternalNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<{
    name: string;
    rollNumber: string;
    studentIdCode: string;
    activationCode: string;
  } | null>(null);

  // Direct add student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStuName, setNewStuName] = useState('');
  const [newStuPhone, setNewStuPhone] = useState('');
  const [newStuEmail, setNewStuEmail] = useState('');
  const [newStuAddress, setNewStuAddress] = useState('');
  const [newStuCourseId, setNewStuCourseId] = useState(courses[0]?.id || 'course-adca');
  const [newStuBatchId, setNewStuBatchId] = useState(batches[0]?.id || '');
  const [creatingStu, setCreatingStu] = useState(false);

  const [search, setSearch] = useState('');

  const handleEnquiryStatus = async (enq: Enquiry, status: Enquiry['status']) => {
    try {
      await updateDocument('enquiries', enq.id, { status });
      showToast(`Enquiry ${enq.referenceNumber} marked ${status}.`, 'success');
      await onRefresh();
    } catch {
      showToast('Failed to update enquiry status.', 'error');
    }
  };

  const openApprovalReview = (app: AdmissionApplication) => {
    setReviewingApp(app);
    setAssignCourseId(app.selectedCourseId || courses[0]?.id || 'course-adca');
    setAssignBatchId(batches[0]?.id || '');
    setAssignSession(currentSession);
    setInternalNotes(app.internalNotes || '');
  };

  const handleApproveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApp) return;
    setApproving(true);
    try {
      const course = courses.find((c) => c.id === assignCourseId) || courses[0];
      const batch = batches.find((b) => b.id === assignBatchId);
      const res = await approveApplicationAndCreateStudent({
        application: reviewingApp,
        courseId: course?.id || assignCourseId,
        courseName: course?.name || reviewingApp.selectedCourseName,
        courseFee: course?.feeAmount || 0,
        batchId: batch?.id || '',
        batchName: batch?.name || reviewingApp.preferredBatch || 'Assigned Batch',
        academicSession: assignSession,
        admissionDate: assignDate,
        internalNotes,
        actorUid,
        actorName,
      });
      setIssuedCredentials({
        name: reviewingApp.fullName,
        rollNumber: res.rollNumber,
        studentIdCode: res.studentIdCode,
        activationCode: res.activationCode,
      });
      setReviewingApp(null);
      showToast(`Application approved! Issued Roll Number: ${res.rollNumber}`, 'success');
      await onRefresh();
    } catch {
      showToast('Failed to approve application.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectOrCorrect = async (
    app: AdmissionApplication,
    status: 'rejected' | 'correction_requested'
  ) => {
    const ok = await confirmAction({
      title: status === 'rejected' ? 'Reject Admission Application?' : 'Request Application Corrections?',
      message: `Are you sure you want to mark ${app.fullName}'s application (${app.applicationId}) as ${status.replace('_', ' ')}?`,
      confirmLabel: status === 'rejected' ? 'Reject Application' : 'Request Corrections',
      destructive: status === 'rejected',
    });
    if (!ok) return;
    try {
      await updateDocument('admissionApplications', app.id, { status });
      showToast(`Application ${app.applicationId} updated to ${status}.`, 'info');
      await onRefresh();
    } catch {
      showToast('Could not update application status.', 'error');
    }
  };

  const handleCreateDirectStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStu(true);
    try {
      const course = courses.find((c) => c.id === newStuCourseId) || courses[0];
      const batch = batches.find((b) => b.id === newStuBatchId);
      const res = await createDirectStudentRecord({
        name: newStuName,
        phone: newStuPhone,
        email: newStuEmail,
        address: newStuAddress,
        courseId: course?.id || newStuCourseId,
        courseName: course?.name || 'ADCA',
        courseFee: course?.feeAmount || 0,
        batchId: batch?.id || '',
        batchName: batch?.name || '',
        academicSession: currentSession,
        admissionDate: new Date().toISOString().slice(0, 10),
        actorUid,
        actorName,
      });
      setIssuedCredentials({
        name: newStuName,
        rollNumber: res.rollNumber,
        studentIdCode: res.studentIdCode,
        activationCode: res.activationCode,
      });
      setShowAddStudent(false);
      setNewStuName('');
      setNewStuPhone('');
      setNewStuEmail('');
      setNewStuAddress('');
      showToast(`Student created! Roll Number: ${res.rollNumber}`, 'success');
      await onRefresh();
    } catch {
      showToast('Could not create student record.', 'error');
    } finally {
      setCreatingStu(false);
    }
  };

  const handleStatusChange = async (stu: StudentProfile, status: StudentProfile['status']) => {
    try {
      await updateStudentStatus(stu, status, actorUid, actorName);
      showToast(`${stu.name} (${stu.rollNumber}) status set to ${status}.`, 'success');
      await onRefresh();
    } catch {
      showToast('Failed to update student status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Issued Roll Number & Activation Code Slip */}
      {issuedCredentials && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Student Account Approved — Hand Over at Admission Desk
              </p>
              <h3 className="mt-1 text-lg font-semibold text-emerald-950">
                {issuedCredentials.name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-xs text-emerald-800 block">Issued Roll Number</span>
                  <span className="font-mono font-bold text-emerald-950 text-base">
                    {issuedCredentials.rollNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-emerald-800 block">Student ID</span>
                  <span className="font-mono font-semibold text-emerald-950">
                    {issuedCredentials.studentIdCode}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-emerald-800 block">One-Time Activation Code</span>
                  <span className="font-mono font-bold text-blue-800 text-base">
                    {issuedCredentials.activationCode}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-emerald-900">
                Provide this Roll Number and Activation Code to the student during admission confirmation so they can set their own password at <strong>Student Login → First-Time Activation</strong>. No automated SMS or email is sent.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIssuedCredentials(null)}
              className="text-xs font-medium text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg bg-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ENQUIRIES */}
      {subTab === 'enquiries' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Public Admission Enquiries ({enquiries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Submitted publicly without login. Track follow-up internally.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportToCsv(
                  'arcec-enquiries.csv',
                  enquiries.map((e) => ({
                    Reference: e.referenceNumber,
                    Name: e.applicantName,
                    Phone: e.phone,
                    Email: e.email || '',
                    Course: e.interestedCourse,
                    Batch: e.preferredBatch || '',
                    Status: e.status,
                    Message: e.message || '',
                  }))
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {enquiries.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No public enquiries received yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="py-2.5 pr-4">Ref</th>
                    <th className="py-2.5 px-3">Applicant</th>
                    <th className="py-2.5 px-3">Course / Batch</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 pl-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700">
                        {e.referenceNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-900">{e.applicantName}</p>
                        <p className="text-xs font-mono text-slate-500">{e.phone}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">
                        <p className="font-medium">{e.interestedCourse}</p>
                        <p className="text-slate-500">{e.preferredBatch || 'Any batch'}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 max-w-xs">
                        {e.message || '—'}
                      </td>
                      <td className="py-3 pl-3">
                        <select
                          value={e.status}
                          onChange={(ev) =>
                            void handleEnquiryStatus(e, ev.target.value as Enquiry['status'])
                          }
                          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMISSION APPLICATIONS */}
      {subTab === 'admissions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Admission Applications ({applications.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Approve pending applications to generate official Roll Numbers and Student Portal activation codes.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  exportToCsv(
                    'arcec-admissions.csv',
                    applications.map((a) => ({
                      ApplicationID: a.applicationId,
                      Name: a.fullName,
                      Phone: a.phone,
                      Course: a.selectedCourseName,
                      Qualification: a.qualification,
                      Status: a.status,
                      IssuedRollNumber: a.issuedRollNumber || '',
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {applications.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No admission applications submitted yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                        <span className="font-semibold text-slate-800">{app.applicationId}</span>
                        <span>·</span>
                        <span
                          className={`font-sans font-semibold capitalize ${
                            app.status === 'approved'
                              ? 'text-emerald-700'
                              : app.status === 'rejected'
                                ? 'text-red-700'
                                : 'text-amber-700'
                          }`}
                        >
                          {app.status.replace('_', ' ')}
                        </span>
                        {app.issuedRollNumber && (
                          <>
                            <span>·</span>
                            <span className="text-blue-700 font-semibold">
                              Roll: {app.issuedRollNumber}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {app.fullName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {app.selectedCourseName} · Phone: <span className="font-mono">{app.phone}</span> · Qualification: {app.qualification}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{app.address}</p>
                    </div>

                    {app.status !== 'approved' && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openApprovalReview(app)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Review &amp; Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRejectOrCorrect(app, 'correction_requested')}
                          className="px-3 py-2 text-xs font-medium text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-50"
                        >
                          Request Correction
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRejectOrCorrect(app, 'rejected')}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Modal */}
          {reviewingApp && (
            <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
              <form
                onSubmit={handleApproveApplication}
                className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  Approve Admission — {reviewingApp.fullName}
                </h3>
                <p className="text-xs text-slate-600">
                  Approving generates an official institute Roll Number, Student ID, Fee Ledger, and Activation Code.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assign Course *
                  </label>
                  <select
                    value={assignCourseId}
                    onChange={(e) => setAssignCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({c.feeLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Assign Batch
                    </label>
                    <select
                      value={assignBatchId}
                      onChange={(e) => setAssignBatchId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.theoryTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Academic Session
                    </label>
                    <input
                      type="text"
                      value={assignSession}
                      onChange={(e) => setAssignSession(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Internal Management Notes
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewingApp(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={approving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{approving ? 'Issuing Roll No...' : 'Approve & Issue Roll Number'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* STUDENTS */}
      {subTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Registered Students ({students.length})
              </h2>
              <p className="text-xs text-slate-500">
                Manage institute-approved student records, Roll Numbers, activation codes, and portal access status.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or roll..."
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowAddStudent(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportToCsv(
                    'arcec-students.csv',
                    students.map((s) => ({
                      RollNumber: s.rollNumber,
                      StudentID: s.studentIdCode,
                      Name: s.name,
                      Phone: s.phone || '',
                      Course: s.courseName,
                      Batch: s.batchName || '',
                      Session: s.academicSession || '',
                      Status: s.status,
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="py-2.5 pr-4">Roll No.</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Course / Batch</th>
                  <th className="py-2.5 px-3">Activation Code</th>
                  <th className="py-2.5 pl-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter(
                    (s) =>
                      !search.trim() ||
                      s.name.toLowerCase().includes(search.toLowerCase()) ||
                      s.rollNumber.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-900">
                        {s.rollNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs font-mono text-slate-500">{s.phone || '—'}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">
                        <p className="font-medium">{s.courseName}</p>
                        <p className="text-slate-500">{s.batchName || '—'}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-blue-700">
                        {s.uid ? 'Activated' : s.activationCode || '—'}
                      </td>
                      <td className="py-3 pl-3">
                        <select
                          value={s.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              s,
                              e.target.value as StudentProfile['status']
                            )
                          }
                          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
                        >
                          <option value="approved">Approved (Pending Activation)</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended (Blocked)</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No students registered yet. Approve an admission application or add a student directly.
              </p>
            )}
          </div>

          {/* Direct Add Student Modal */}
          {showAddStudent && (
            <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateDirectStudent}
                className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  Register Approved Student Directly
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStuName}
                      onChange={(e) => setNewStuName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newStuPhone}
                      onChange={(e) => setNewStuPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Course</label>
                    <select
                      value={newStuCourseId}
                      onChange={(e) => setNewStuCourseId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.feeLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Batch</label>
                    <select
                      value={newStuBatchId}
                      onChange={(e) => setNewStuBatchId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="email"
                  value={newStuEmail}
                  onChange={(e) => setNewStuEmail(e.target.value)}
                  placeholder="Optional Email"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newStuAddress}
                  onChange={(e) => setNewStuAddress(e.target.value)}
                  placeholder="Address"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStu}
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                  >
                    {creatingStu ? 'Creating...' : 'Create & Issue Roll Number'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
