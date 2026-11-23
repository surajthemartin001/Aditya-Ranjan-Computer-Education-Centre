import React, { useState } from 'react';
import { Download, Plus, Save } from 'lucide-react';
import {
  exportToCsv,
  logActivity,
  makeSafeId,
  saveDocument,
  uploadMediaFile,
} from '../../../services/firestoreService';
import { useToast } from '../../../components/ToastContext';
import type {
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  Course,
  Examination,
  ExamResult,
  MCQQuestion,
  StudentProfile,
  StudyMaterial,
} from '../../../types/models';

interface Props {
  subTab: 'attendance' | 'materials' | 'assignments' | 'exams';
  students: StudentProfile[];
  courses: Course[];
  attendance: AttendanceRecord[];
  materials: StudyMaterial[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  exams: Examination[];
  results: ExamResult[];
  actorUid: string;
  actorName: string;
  actorRole: string;
  canPublishTests?: boolean;
  onRefresh: () => Promise<void>;
}

export function AcademicAndExamSection({
  subTab,
  students,
  courses,
  attendance,
  materials,
  assignments,
  submissions,
  exams,
  results,
  actorUid,
  actorName,
  actorRole,
  canPublishTests = true,
  onRefresh,
}: Props) {
  const { showToast } = useToast();

  // Attendance state
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attCourseFilter, setAttCourseFilter] = useState('all');
  const [attDraft, setAttDraft] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [savingAtt, setSavingAtt] = useState(false);

  // Study material state
  const [matTitle, setMatTitle] = useState('');
  const [matModule, setMatModule] = useState('Module 1');
  const [matCourseId, setMatCourseId] = useState(courses[0]?.id || 'course-adca');
  const [matType, setMatType] = useState<StudyMaterial['fileType']>('pdf');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [uploadingMat, setUploadingMat] = useState(false);

  // Assignment state
  const [asgTitle, setAsgTitle] = useState('');
  const [asgCourseId, setAsgCourseId] = useState(courses[0]?.id || 'course-adca');
  const [asgDueDate, setAsgDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [asgMaxMarks, setAsgMaxMarks] = useState('20');
  const [asgDesc, setAsgDesc] = useState('');

  // Exam & Question bank state
  const [exTitle, setExTitle] = useState('');
  const [exCourseId, setExCourseId] = useState(courses[0]?.id || 'course-adca');
  const [exDuration, setExDuration] = useState('30');
  const [exDate, setExDate] = useState(new Date().toISOString().slice(0, 10));
  const [exPublished, setExPublished] = useState(canPublishTests);
  const [questions, setQuestions] = useState<MCQQuestion[]>([
    {
      id: 'q1',
      question: 'Which keyboard shortcut saves a document in MS Word?',
      options: ['Ctrl + S', 'Ctrl + P', 'Ctrl + Z', 'Ctrl + X'],
      correctIndex: 0,
      marks: 2,
    },
  ]);

  const filteredStudents = students.filter(
    (s) =>
      s.status !== 'suspended' &&
      (attCourseFilter === 'all' || s.courseId === attCourseFilter)
  );

  const handleSaveAttendance = async () => {
    if (filteredStudents.length === 0) return;
    setSavingAtt(true);
    try {
      for (const stu of filteredStudents) {
        const status = attDraft[stu.id] || 'present';
        const docId = `ATT-${attDate}-${stu.rollNumber.replace(/[^A-Z0-9_-]/gi, '')}`;
        await saveDocument('attendance', docId, {
          studentId: stu.id,
          studentUid: stu.uid || '',
          studentName: stu.name,
          rollNumber: stu.rollNumber,
          courseId: stu.courseId || '',
          batchId: stu.batchId || '',
          date: attDate,
          status,
          markedBy: actorUid,
          remarks: '',
        });
      }
      await logActivity({
        action: 'MARK_ATTENDANCE',
        module: 'Attendance',
        actorUid,
        actorName,
        actorRole,
        details: `Marked attendance for ${filteredStudents.length} students on ${attDate}.`,
      });
      showToast(`Attendance saved for ${filteredStudents.length} students (${attDate}).`, 'success');
      await onRefresh();
    } catch {
      showToast('Could not save attendance records.', 'error');
    } finally {
      setSavingAtt(false);
    }
  };

  const handleFileUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMat(true);
    try {
      const { promise } = uploadMediaFile(file, 'study_materials');
      const uploaded = await promise;
      setMatUrl(uploaded.url);
      showToast('File uploaded to Firebase Storage.', 'success');
    } catch {
      showToast('Storage upload unavailable; you may paste a direct resource URL instead.', 'info');
    } finally {
      setUploadingMat(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = makeSafeId('MAT');
    try {
      await saveDocument('studyMaterials', id, {
        title: matTitle.trim(),
        description: matDesc.trim(),
        courseId: matCourseId,
        moduleName: matModule.trim(),
        fileType: matType,
        fileUrl: matUrl.trim(),
        isPublished: true,
        uploadedBy: actorUid,
      });
      showToast('Study material published to enrolled students.', 'success');
      setMatTitle('');
      setMatDesc('');
      setMatUrl('');
      await onRefresh();
    } catch {
      showToast('Failed to save study material.', 'error');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = makeSafeId('ASG');
    try {
      await saveDocument('assignments', id, {
        title: asgTitle.trim(),
        description: asgDesc.trim(),
        courseId: asgCourseId,
        dueDate: asgDueDate,
        maxMarks: Number(asgMaxMarks) || 20,
        isPublished: true,
        createdBy: actorUid,
      });
      showToast('Assignment created.', 'success');
      setAsgTitle('');
      setAsgDesc('');
      await onRefresh();
    } catch {
      showToast('Failed to create assignment.', 'error');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = makeSafeId('EXM');
    const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);
    try {
      await saveDocument('examinations', id, {
        title: exTitle.trim(),
        description: `${questions.length} MCQ questions`,
        courseId: exCourseId,
        durationMinutes: Number(exDuration) || 30,
        totalMarks,
        passingMarks: Math.ceil(totalMarks * 0.4),
        scheduledDate: exDate,
        questions,
        isPublished: canPublishTests ? exPublished : false,
        createdBy: actorUid,
      });
      showToast('MCQ Examination saved to Firestore.', 'success');
      setExTitle('');
      await onRefresh();
    } catch {
      showToast('Failed to create examination.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ATTENDANCE */}
      {subTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Mark Daily Attendance</h2>
                <p className="text-xs text-slate-500">
                  Attendance edits are logged in the institute audit trail.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
                <select
                  value={attCourseFilter}
                  onChange={(e) => setAttCourseFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    exportToCsv(
                      'arcec-attendance.csv',
                      attendance.map((a) => ({
                        Date: a.date,
                        RollNumber: a.rollNumber,
                        Student: a.studentName,
                        Status: a.status,
                      }))
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No active students found for this filter.
              </p>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => {
                    const current = attDraft[stu.id] || 'present';
                    return (
                      <div
                        key={stu.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{stu.name}</p>
                          <p className="text-xs font-mono text-slate-500">
                            {stu.rollNumber} · {stu.courseName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                          {(['present', 'late', 'absent'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setAttDraft((d) => ({ ...d, [stu.id]: st }))}
                              className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${
                                current === st
                                  ? st === 'present'
                                    ? 'bg-emerald-700 text-white'
                                    : st === 'late'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-red-700 text-white'
                                  : 'text-slate-600'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={savingAtt}
                  onClick={() => void handleSaveAttendance()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAtt ? 'Saving Attendance...' : `Save Attendance (${attDate})`}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* STUDY MATERIALS */}
      {subTab === 'materials' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateMaterial}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Upload Private Study Material / Practical File
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                placeholder="Resource Title *"
                className="sm:col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                value={matCourseId}
                onChange={(e) => setMatCourseId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={matModule}
                onChange={(e) => setMatModule(e.target.value)}
                placeholder="Module / Chapter"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                value={matType}
                onChange={(e) => setMatType(e.target.value as StudyMaterial['fileType'])}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="pdf">PDF Document</option>
                <option value="practical">Practical File</option>
                <option value="notes">Class Notes</option>
                <option value="link">Reference Link</option>
              </select>
              <input
                type="file"
                onChange={handleFileUploadMaterial}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-slate-50"
              />
            </div>
            <input
              type="url"
              value={matUrl}
              onChange={(e) => setMatUrl(e.target.value)}
              placeholder={uploadingMat ? 'Uploading...' : 'Resource URL (auto-filled after upload)'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <textarea
              rows={2}
              value={matDesc}
              onChange={(e) => setMatDesc(e.target.value)}
              placeholder="Short notes for students..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              Publish Material to Students
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Published Study Materials ({materials.length})
            </h3>
            <div className="divide-y divide-slate-200 text-sm">
              {materials.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {m.moduleName} · {m.fileType.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-700">
                    {m.isPublished ? 'Published' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS */}
      {subTab === 'assignments' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateAssignment}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">Create Course Assignment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="Assignment Title *"
                className="sm:col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                value={asgCourseId}
                onChange={(e) => setAsgCourseId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={asgDueDate}
                onChange={(e) => setAsgDueDate(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                value={asgMaxMarks}
                onChange={(e) => setAsgMaxMarks(e.target.value)}
                placeholder="Max Marks"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <textarea
              rows={2}
              value={asgDesc}
              onChange={(e) => setAsgDesc(e.target.value)}
              placeholder="Assignment instructions..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              Publish Assignment
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Student Submissions ({submissions.length}) · Active Assignments ({assignments.length})
            </h3>
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-500">No student submissions yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 text-sm">
                {submissions.map((s) => (
                  <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {s.studentName} ({s.rollNumber})
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{s.submissionText}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await saveDocument('assignmentSubmissions', s.id, {
                          status: 'graded',
                          marksObtained: 18,
                          feedback: 'Reviewed and accepted.',
                        });
                        showToast('Marked as graded.', 'success');
                        await onRefresh();
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg"
                    >
                      {s.status === 'graded' ? `Graded (${s.marksObtained})` : 'Mark Graded'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONLINE MCQ EXAMINATIONS */}
      {subTab === 'exams' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateExam}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Create Online MCQ Examination
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={exTitle}
                onChange={(e) => setExTitle(e.target.value)}
                placeholder="Exam Title (e.g., ADCA Unit Test 1)"
                className="sm:col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <select
                value={exCourseId}
                onChange={(e) => setExCourseId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={exDuration}
                onChange={(e) => setExDuration(e.target.value)}
                placeholder="Minutes"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Question {qIdx + 1}</span>
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[qIdx] = { ...q, marks: Number(e.target.value) || 1 };
                        setQuestions(copy);
                      }}
                      className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white"
                      title="Marks"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => {
                      const copy = [...questions];
                      copy[qIdx] = { ...q, question: e.target.value };
                      setQuestions(copy);
                    }}
                    placeholder="Question text..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctIndex === oIdx}
                          onChange={() => {
                            const copy = [...questions];
                            copy[qIdx] = { ...q, correctIndex: oIdx };
                            setQuestions(copy);
                          }}
                          title="Mark as correct option"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const copy = [...questions];
                            const opts = [...q.options];
                            opts[oIdx] = e.target.value;
                            copy[qIdx] = { ...q, options: opts };
                            setQuestions(copy);
                          }}
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setQuestions((prev) => [
                    ...prev,
                    {
                      id: `q${prev.length + 1}_${Date.now()}`,
                      question: '',
                      options: ['', '', '', ''],
                      correctIndex: 0,
                      marks: 2,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add MCQ Question</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <input
                  type="date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  className="px-2.5 py-1.5 font-mono border border-slate-300 rounded"
                />
                {canPublishTests && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exPublished}
                      onChange={(e) => setExPublished(e.target.checked)}
                    />
                    <span>Publish immediately to students</span>
                  </label>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
              >
                Save Examination
              </button>
            </div>
          </form>

          {/* Exam Results Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Examinations ({exams.length}) &amp; Auto-Evaluated Results ({results.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  exportToCsv(
                    'arcec-exam-results.csv',
                    results.map((r) => ({
                      RollNumber: r.rollNumber,
                      Student: r.studentName,
                      Exam: r.examTitle,
                      Score: r.score,
                      Total: r.totalMarks,
                      Percentage: `${r.percentage}%`,
                      Passed: r.passed ? 'Pass' : 'Fail',
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results CSV</span>
              </button>
            </div>
            {results.length === 0 ? (
              <p className="text-sm text-slate-500">No student test submissions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <th className="py-2 pr-4">Roll No.</th>
                      <th className="py-2 px-3">Student</th>
                      <th className="py-2 px-3">Exam</th>
                      <th className="py-2 px-3 text-right">Score</th>
                      <th className="py-2 pl-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-4 font-mono text-xs">{r.rollNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{r.studentName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{r.examTitle}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.score}/{r.totalMarks} ({r.percentage}%)
                        </td>
                        <td
                          className={`py-2.5 pl-3 text-xs font-semibold ${
                            r.passed ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {r.passed ? 'Passed' : 'Failed'}
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
    </div>
  );
}
