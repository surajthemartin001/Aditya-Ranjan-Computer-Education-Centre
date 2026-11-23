import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import {
  DEFAULT_BATCHES,
  DEFAULT_COURSES,
  DEFAULT_GALLERY_MEDIA,
  DEFAULT_PUBLIC_FACULTY,
  DEFAULT_PUBLIC_NOTICES,
  DEFAULT_SESSIONS,
  DEFAULT_WEBSITE_CONTENT,
  DEFAULT_WEBSITE_SETTINGS,
} from '../data/verifiedDefaults';
import type {
  AcademicSession,
  ActivityLog,
  AdmissionApplication,
  Announcement,
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  Batch,
  CertificateRecord,
  Course,
  Enquiry,
  Examination,
  ExamResult,
  FeeRecord,
  FinancialTransaction,
  GalleryMedia,
  Payment,
  PublicFaculty,
  PublicNotice,
  StaffProfile,
  StudentProfile,
  StudyMaterial,
  WebsiteContent,
  WebsiteSettings,
} from '../types/models';

export function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${stamp}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function normalizeEmailKey(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/[^a-z0-9_-]/g, '_');
}

export function sanitizeRollKey(roll: string): string {
  return roll
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

export function generateRollNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `ARCEC-${year}-${String(sequence).padStart(4, '0')}`;
}

export function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'ACT';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ARCEC-CERT-${year}-${rand}`;
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (val: unknown) => {
    const str = val == null ? '' : String(val);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------
// Audit Activity Logging
// ---------------------------------------------------------
export async function logActivity(params: {
  action: string;
  module: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  targetId?: string;
  details: string;
}) {
  const id = makeSafeId('LOG');
  const path = `activityLogs/${id}`;
  try {
    await setDoc(doc(db, 'activityLogs', id), {
      action: params.action.slice(0, 120),
      module: params.module.slice(0, 80),
      actorUid: params.actorUid.slice(0, 128),
      actorName: params.actorName.slice(0, 140),
      actorRole: params.actorRole.slice(0, 40),
      targetId: (params.targetId || '').slice(0, 128),
      details: params.details.slice(0, 600),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Activity log write skipped:', error);
  }
}

// ---------------------------------------------------------
// Initial Verified Institute Data Seeder (Management Only)
// ---------------------------------------------------------
export async function seedVerifiedInstituteData(actorUid: string, actorName: string) {
  try {
    const batch = writeBatch(db);

    batch.set(doc(db, 'websiteSettings', 'main'), {
      ...DEFAULT_WEBSITE_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    for (const [key, item] of Object.entries(DEFAULT_WEBSITE_CONTENT)) {
      batch.set(doc(db, 'websiteContent', key), {
        ...item,
        updatedAt: serverTimestamp(),
      });
    }

    for (const course of DEFAULT_COURSES) {
      batch.set(doc(db, 'courses', course.id), {
        ...course,
        updatedAt: serverTimestamp(),
      });
    }

    for (const b of DEFAULT_BATCHES) {
      batch.set(doc(db, 'batches', b.id), {
        ...b,
        updatedAt: serverTimestamp(),
      });
    }

    for (const f of DEFAULT_PUBLIC_FACULTY) {
      batch.set(doc(db, 'publicFaculty', f.id), {
        ...f,
        updatedAt: serverTimestamp(),
      });
    }

    for (const n of DEFAULT_PUBLIC_NOTICES) {
      batch.set(doc(db, 'publicNotices', n.id), {
        ...n,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const g of DEFAULT_GALLERY_MEDIA) {
      batch.set(doc(db, 'galleryMedia', g.id), {
        ...g,
        createdAt: serverTimestamp(),
      });
    }

    for (const s of DEFAULT_SESSIONS) {
      batch.set(doc(db, 'academicSessions', s.id), s);
    }

    await batch.commit();

    await logActivity({
      action: 'INITIALIZE_VERIFIED_INSTITUTE_DATA',
      module: 'CMS',
      actorUid,
      actorName,
      actorRole: 'managing_director',
      details: 'Seeded verified institutional courses, timetable, faculty, notices, gallery, and settings.',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'websiteSettings/main');
  }
}

// ---------------------------------------------------------
// Public Website Readers (No Login Required)
// ---------------------------------------------------------
export async function fetchPublicWebsiteBundle() {
  const safeGetList = async <T,>(qRef: ReturnType<typeof query> | ReturnType<typeof collection>): Promise<T[]> => {
    try {
      const snap = await getDocs(qRef);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as T);
    } catch {
      return [];
    }
  };

  let settings = DEFAULT_WEBSITE_SETTINGS;
  try {
    const snap = await getDoc(doc(db, 'websiteSettings', 'main'));
    if (snap.exists()) {
      settings = { id: snap.id, ...(snap.data() as Omit<WebsiteSettings, 'id'>) };
    }
  } catch {
    // fallback to verified defaults
  }

  const [contentList, courseList, batchList, facultyList, noticeList, mediaList] = await Promise.all([
    safeGetList<WebsiteContent>(query(collection(db, 'websiteContent'), where('status', '==', 'published'))),
    safeGetList<Course>(
      query(collection(db, 'courses'), where('isPublished', '==', true), where('isActive', '==', true))
    ),
    safeGetList<Batch>(query(collection(db, 'batches'), where('isPublicTimetable', '==', true))),
    safeGetList<PublicFaculty>(query(collection(db, 'publicFaculty'), where('isPublished', '==', true))),
    safeGetList<PublicNotice>(query(collection(db, 'publicNotices'), where('isPublished', '==', true))),
    safeGetList<GalleryMedia>(query(collection(db, 'galleryMedia'), where('isPublished', '==', true))),
  ]);

  const contentMap: Record<string, WebsiteContent> = { ...DEFAULT_WEBSITE_CONTENT };
  for (const c of contentList) {
    contentMap[c.pageKey || c.id] = c;
  }

  const courses = (courseList.length > 0 ? courseList : DEFAULT_COURSES).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)
  );
  const batches = (batchList.length > 0 ? batchList : DEFAULT_BATCHES).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)
  );
  const faculty = (facultyList.length > 0 ? facultyList : DEFAULT_PUBLIC_FACULTY).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)
  );
  const notices = (noticeList.length > 0 ? noticeList : DEFAULT_PUBLIC_NOTICES).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return (b.publishedDate || '').localeCompare(a.publishedDate || '');
  });
  const gallery = (mediaList.length > 0 ? mediaList : DEFAULT_GALLERY_MEDIA).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)
  );

  return {
    settings,
    content: contentMap,
    courses,
    batches,
    faculty,
    notices,
    gallery,
    isSeeded: courseList.length > 0,
  };
}

// ---------------------------------------------------------
// Public Write-Only Forms (Enquiry & Admission Application)
// ---------------------------------------------------------
export async function submitPublicEnquiry(input: {
  applicantName: string;
  phone: string;
  email?: string;
  interestedCourse: string;
  preferredBatch?: string;
  qualification?: string;
  message?: string;
  consentGiven: boolean;
}): Promise<string> {
  const referenceNumber = makeSafeId('ENQ');
  const payload = {
    referenceNumber,
    applicantName: input.applicantName.trim().slice(0, 140),
    phone: input.phone.trim().slice(0, 25),
    email: (input.email || '').trim().slice(0, 160),
    interestedCourse: input.interestedCourse.trim().slice(0, 120),
    preferredBatch: (input.preferredBatch || '').trim().slice(0, 120),
    qualification: (input.qualification || '').trim().slice(0, 160),
    message: (input.message || '').trim().slice(0, 1500),
    consentGiven: Boolean(input.consentGiven),
    status: 'new',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'enquiries', referenceNumber), payload);
    return referenceNumber;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `enquiries/${referenceNumber}`);
  }
}

export async function submitAdmissionApplication(input: {
  fullName: string;
  fatherOrGuardianName?: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address: string;
  qualification: string;
  selectedCourseId?: string;
  selectedCourseName: string;
  preferredBatch?: string;
  documentNotes?: string;
}): Promise<string> {
  const applicationId = makeSafeId('APP');
  const payload = {
    applicationId,
    fullName: input.fullName.trim().slice(0, 140),
    fatherOrGuardianName: (input.fatherOrGuardianName || '').trim().slice(0, 140),
    dateOfBirth: (input.dateOfBirth || '').trim().slice(0, 30),
    phone: input.phone.trim().slice(0, 25),
    email: (input.email || '').trim().slice(0, 160),
    address: input.address.trim().slice(0, 400),
    qualification: input.qualification.trim().slice(0, 160),
    selectedCourseId: (input.selectedCourseId || '').trim().slice(0, 80),
    selectedCourseName: input.selectedCourseName.trim().slice(0, 140),
    preferredBatch: (input.preferredBatch || '').trim().slice(0, 120),
    documentNotes: (input.documentNotes || '').trim().slice(0, 500),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'admissionApplications', applicationId), payload);
    return applicationId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admissionApplications/${applicationId}`);
  }
}

export async function verifyPublicCertificate(certificateId: string) {
  const cleanId = certificateId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanId) return null;
  try {
    const snap = await getDoc(doc(db, 'publicCertificates', cleanId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as {
      id: string;
      certificateId: string;
      studentName: string;
      rollNumber: string;
      courseName: string;
      issueDate: string;
      grade: string;
      status: 'valid' | 'revoked';
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `publicCertificates/${cleanId}`);
  }
}

// ---------------------------------------------------------
// Admission Approval & Student Account Provisioning (Management)
// ---------------------------------------------------------
export async function approveApplicationAndCreateStudent(params: {
  application: AdmissionApplication;
  courseId: string;
  courseName: string;
  courseFee: number;
  batchId: string;
  batchName: string;
  academicSession: string;
  admissionDate: string;
  internalNotes?: string;
  actorUid: string;
  actorName: string;
}): Promise<{ rollNumber: string; studentIdCode: string; activationCode: string; studentDocId: string }> {
  try {
    const existingStudentsSnap = await getDocs(collection(db, 'studentProfiles'));
    const nextSeq = existingStudentsSnap.size + 1;
    const rollNumber = generateRollNumber(nextSeq);
    const studentIdCode = `SID-${rollNumber}`;
    const activationCode = generateActivationCode();
    const studentDocId = makeSafeId('STU');
    const rollKey = sanitizeRollKey(rollNumber);
    const activationKey = `${rollKey}_${activationCode}`;
    const syntheticEmail = `${rollKey.toLowerCase()}@students.arcec.local`;

    const batch = writeBatch(db);

    batch.update(doc(db, 'admissionApplications', params.application.id), {
      status: 'approved',
      issuedRollNumber: rollNumber,
      internalNotes: (params.internalNotes || '').slice(0, 1000),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'studentProfiles', studentDocId), {
      uid: '',
      rollNumber,
      studentIdCode,
      applicationId: params.application.applicationId,
      name: params.application.fullName,
      fatherOrGuardianName: params.application.fatherOrGuardianName || '',
      dateOfBirth: params.application.dateOfBirth || '',
      phone: params.application.phone,
      email: params.application.email || '',
      address: params.application.address,
      qualification: params.application.qualification,
      photoUrl: '',
      courseId: params.courseId,
      courseName: params.courseName,
      batchId: params.batchId,
      batchName: params.batchName,
      academicSession: params.academicSession,
      admissionDate: params.admissionDate,
      status: 'approved',
      activationCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'studentActivations', activationKey), {
      rollNumber: rollKey,
      studentDocId,
      activationCode,
      loginEmail: syntheticEmail,
      status: 'pending_activation',
      uid: '',
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'studentLoginLookup', rollKey), {
      rollNumber: rollKey,
      loginEmail: syntheticEmail,
      status: 'pending_activation',
      updatedAt: serverTimestamp(),
    });

    const feeDocId = makeSafeId('FEE');
    const feeTotal = Number(params.courseFee) || 0;
    batch.set(doc(db, 'feeRecords', feeDocId), {
      studentId: studentDocId,
      studentUid: '',
      studentName: params.application.fullName,
      rollNumber,
      courseName: params.courseName,
      totalFee: feeTotal,
      discount: 0,
      scholarship: 0,
      netFee: feeTotal,
      amountPaid: 0,
      balanceDue: feeTotal,
      dueDate: '',
      installmentPlan: 'Standard Institute Schedule',
      status: feeTotal > 0 ? 'pending' : 'paid',
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    await logActivity({
      action: 'APPROVE_ADMISSION',
      module: 'Admissions',
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorRole: 'managing_director',
      targetId: studentDocId,
      details: `Approved application ${params.application.applicationId} for ${params.application.fullName}. Issued Roll Number ${rollNumber}.`,
    });

    return { rollNumber, studentIdCode, activationCode, studentDocId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admissionApplications/approve');
  }
}

export async function createDirectStudentRecord(params: {
  name: string;
  fatherOrGuardianName?: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address?: string;
  qualification?: string;
  courseId: string;
  courseName: string;
  courseFee: number;
  batchId: string;
  batchName: string;
  academicSession: string;
  admissionDate: string;
  actorUid: string;
  actorName: string;
}) {
  try {
    const existingStudentsSnap = await getDocs(collection(db, 'studentProfiles'));
    const nextSeq = existingStudentsSnap.size + 1;
    const rollNumber = generateRollNumber(nextSeq);
    const studentIdCode = `SID-${rollNumber}`;
    const activationCode = generateActivationCode();
    const studentDocId = makeSafeId('STU');
    const rollKey = sanitizeRollKey(rollNumber);
    const activationKey = `${rollKey}_${activationCode}`;
    const syntheticEmail = `${rollKey.toLowerCase()}@students.arcec.local`;

    const batch = writeBatch(db);

    batch.set(doc(db, 'studentProfiles', studentDocId), {
      uid: '',
      rollNumber,
      studentIdCode,
      applicationId: 'DIRECT',
      name: params.name.trim(),
      fatherOrGuardianName: (params.fatherOrGuardianName || '').trim(),
      dateOfBirth: (params.dateOfBirth || '').trim(),
      phone: params.phone.trim(),
      email: (params.email || '').trim(),
      address: (params.address || '').trim(),
      qualification: (params.qualification || '').trim(),
      photoUrl: '',
      courseId: params.courseId,
      courseName: params.courseName,
      batchId: params.batchId,
      batchName: params.batchName,
      academicSession: params.academicSession,
      admissionDate: params.admissionDate,
      status: 'approved',
      activationCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'studentActivations', activationKey), {
      rollNumber: rollKey,
      studentDocId,
      activationCode,
      loginEmail: syntheticEmail,
      status: 'pending_activation',
      uid: '',
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'studentLoginLookup', rollKey), {
      rollNumber: rollKey,
      loginEmail: syntheticEmail,
      status: 'pending_activation',
      updatedAt: serverTimestamp(),
    });

    const feeDocId = makeSafeId('FEE');
    const feeTotal = Number(params.courseFee) || 0;
    batch.set(doc(db, 'feeRecords', feeDocId), {
      studentId: studentDocId,
      studentUid: '',
      studentName: params.name.trim(),
      rollNumber,
      courseName: params.courseName,
      totalFee: feeTotal,
      discount: 0,
      scholarship: 0,
      netFee: feeTotal,
      amountPaid: 0,
      balanceDue: feeTotal,
      dueDate: '',
      installmentPlan: 'Standard Institute Schedule',
      status: feeTotal > 0 ? 'pending' : 'paid',
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    await logActivity({
      action: 'CREATE_STUDENT',
      module: 'Students',
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorRole: 'managing_director',
      targetId: studentDocId,
      details: `Created student ${params.name} with Roll Number ${rollNumber}.`,
    });

    return { rollNumber, studentIdCode, activationCode, studentDocId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'studentProfiles');
  }
}

export async function updateStudentStatus(
  student: StudentProfile,
  newStatus: StudentProfile['status'],
  actorUid: string,
  actorName: string
) {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'studentProfiles', student.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    const rollKey = sanitizeRollKey(student.rollNumber);
    batch.set(
      doc(db, 'studentLoginLookup', rollKey),
      {
        rollNumber: rollKey,
        status: newStatus === 'suspended' ? 'suspended' : student.uid ? 'active' : 'pending_activation',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (student.uid) {
      batch.set(
        doc(db, 'userDirectory', student.uid),
        {
          uid: student.uid,
          role: 'student',
          studentDocId: student.id,
          rollNumber: student.rollNumber,
          status: newStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();

    await logActivity({
      action: 'UPDATE_STUDENT_STATUS',
      module: 'Students',
      actorUid,
      actorName,
      actorRole: 'managing_director',
      targetId: student.id,
      details: `Changed ${student.name} (${student.rollNumber}) status to ${newStatus}.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `studentProfiles/${student.id}`);
  }
}

// ---------------------------------------------------------
// Generic CRUD Helpers for Authenticated Portals
// ---------------------------------------------------------
export async function listCollection<T>(colName: string): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, colName));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

export async function listCollectionWhere<T>(
  colName: string,
  field: string,
  value: unknown
): Promise<T[]> {
  try {
    const snap = await getDocs(query(collection(db, colName), where(field, '==', value)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${colName}?${field}=${String(value)}`);
  }
}

export async function saveDocument(colName: string, id: string, data: Record<string, unknown>) {
  try {
    await setDoc(
      doc(db, colName, id),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${colName}/${id}`);
  }
}

export async function updateDocument(colName: string, id: string, data: Record<string, unknown>) {
  try {
    await updateDoc(doc(db, colName, id), { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${colName}/${id}`);
  }
}

export async function removeDocument(colName: string, id: string) {
  try {
    await deleteDoc(doc(db, colName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
}

// ---------------------------------------------------------
// Fee Payment Recording (Atomic Ledger Update + Receipt)
// ---------------------------------------------------------
export async function recordFeePayment(params: {
  feeRecord: FeeRecord;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  remarks?: string;
  actorUid: string;
  actorName: string;
}) {
  const paymentId = makeSafeId('PAY');
  const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const newPaid = Number(params.feeRecord.amountPaid || 0) + Number(params.amount);
  const newBalance = Math.max(0, Number(params.feeRecord.netFee) - newPaid);
  const newStatus: FeeRecord['status'] =
    newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'payments', paymentId), {
      feeRecordId: params.feeRecord.id,
      studentId: params.feeRecord.studentId,
      studentUid: params.feeRecord.studentUid || '',
      studentName: params.feeRecord.studentName,
      rollNumber: params.feeRecord.rollNumber,
      receiptNumber,
      amount: Number(params.amount),
      paymentMode: params.paymentMode,
      paymentDate: params.paymentDate,
      remarks: (params.remarks || '').slice(0, 300),
      recordedBy: params.actorUid,
      createdAt: serverTimestamp(),
    });

    batch.update(doc(db, 'feeRecords', params.feeRecord.id), {
      amountPaid: newPaid,
      balanceDue: newBalance,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    const txId = makeSafeId('TX');
    batch.set(doc(db, 'financialTransactions', txId), {
      type: 'income',
      category: 'Course Fee Collection',
      description: `Fee payment by ${params.feeRecord.studentName} (${params.feeRecord.rollNumber})`,
      amount: Number(params.amount),
      date: params.paymentDate,
      reference: receiptNumber,
      recordedBy: params.actorUid,
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    await logActivity({
      action: 'RECORD_PAYMENT',
      module: 'Fees',
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorRole: 'managing_director',
      targetId: paymentId,
      details: `Recorded ₹${params.amount} (${params.paymentMode}) for ${params.feeRecord.rollNumber}, Receipt ${receiptNumber}.`,
    });

    return { paymentId, receiptNumber };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payments/${paymentId}`);
  }
}

// ---------------------------------------------------------
// Certificate Issuance & Revocation (Private + Public Verification Sync)
// ---------------------------------------------------------
export async function issueStudentCertificate(params: {
  student: StudentProfile;
  grade: string;
  issueDate: string;
  actorUid: string;
  actorName: string;
}) {
  const certificateId = generateCertificateId();
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'certificates', certificateId), {
      certificateId,
      studentId: params.student.id,
      studentUid: params.student.uid || '',
      studentName: params.student.name,
      rollNumber: params.student.rollNumber,
      courseName: params.student.courseName,
      issueDate: params.issueDate,
      grade: params.grade,
      status: 'valid',
      issuedBy: params.actorUid,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'publicCertificates', certificateId), {
      certificateId,
      studentName: params.student.name,
      rollNumber: params.student.rollNumber,
      courseName: params.student.courseName,
      issueDate: params.issueDate,
      grade: params.grade,
      status: 'valid',
    });
    await batch.commit();

    await logActivity({
      action: 'ISSUE_CERTIFICATE',
      module: 'Certificates',
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorRole: 'managing_director',
      targetId: certificateId,
      details: `Issued certificate ${certificateId} to ${params.student.name} (${params.student.rollNumber}).`,
    });

    return certificateId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `certificates/${certificateId}`);
  }
}

export async function toggleCertificateStatus(
  cert: CertificateRecord,
  newStatus: 'valid' | 'revoked',
  reason: string,
  actorUid: string,
  actorName: string
) {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'certificates', cert.id), {
      status: newStatus,
      revokeReason: reason.slice(0, 300),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'publicCertificates', cert.certificateId), {
      status: newStatus,
    });
    await batch.commit();

    await logActivity({
      action: newStatus === 'revoked' ? 'REVOKE_CERTIFICATE' : 'RESTORE_CERTIFICATE',
      module: 'Certificates',
      actorUid,
      actorName,
      actorRole: 'managing_director',
      targetId: cert.certificateId,
      details: `Certificate ${cert.certificateId} marked ${newStatus}. ${reason}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `certificates/${cert.id}`);
  }
}

// ---------------------------------------------------------
// Firebase Storage Upload with Progress & Cancel
// ---------------------------------------------------------
export function uploadMediaFile(
  file: File,
  folder: 'public_gallery' | 'study_materials' | 'student_photos',
  onProgress?: (pct: number) => void
): { task: UploadTask; promise: Promise<{ url: string; storagePath: string }> } {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${safeName}`;
  const fileRef = ref(storage, storagePath);
  const task = uploadBytesResumable(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const promise = new Promise<{ url: string; storagePath: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  return { task, promise };
}

export async function deleteStorageFile(storagePath?: string) {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (error) {
    console.warn('Could not delete storage object (may already be removed):', error);
  }
}

// Re-export model helpers for convenience
export type {
  AcademicSession,
  ActivityLog,
  AdmissionApplication,
  Announcement,
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  Batch,
  CertificateRecord,
  Course,
  Enquiry,
  Examination,
  ExamResult,
  FeeRecord,
  FinancialTransaction,
  GalleryMedia,
  Payment,
  PublicFaculty,
  PublicNotice,
  StaffProfile,
  StudentProfile,
  StudyMaterial,
  WebsiteContent,
  WebsiteSettings,
};
