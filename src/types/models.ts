export type Language = 'en' | 'hi';

export interface WebsiteSettings {
  id: string;
  instituteName: string;
  instituteNameHi: string;
  establishedYear: number;
  address: string;
  addressHi: string;
  managingDirector: string;
  directorQualification: string;
  contactPhone: string;
  contactEmail: string;
  mapsUrl: string;
  branchesCount: number;
  currentSession: string;
  seoTitle: string;
  seoDescription: string;
  feePolicyNote: string;
  paymentOptionsNote: string;
  installmentNote: string;
  scholarshipNote: string;
  footerNote: string;
  updatedAt?: unknown;
}

export interface WebsiteContent {
  id: string;
  pageKey: string;
  status: 'draft' | 'published';
  heroTitle: string;
  heroTitleHi: string;
  heroSubtitle: string;
  heroSubtitleHi: string;
  body: string;
  bodyHi: string;
  vision?: string;
  mission?: string;
  methodology?: string;
  infrastructureNote?: string;
  isVisible: boolean;
  revisionCount: number;
  updatedAt?: unknown;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  duration: string;
  feeAmount?: number;
  feeLabel: string;
  feeNote?: string;
  eligibility?: string;
  outcomes: string[];
  syllabusOverview: string[];
  imageUrl: string;
  isPublished: boolean;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: unknown;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  courseCode: string;
  theoryTime: string;
  practicalTime: string;
  scheduleNote?: string;
  classroom?: string;
  capacity?: number;
  teacherName?: string;
  teacherId?: string;
  academicSession?: string;
  isPublicTimetable: boolean;
  displayOrder: number;
  updatedAt?: unknown;
}

export interface PublicFaculty {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  subjectsTaught: string[];
  specialization?: string;
  bio: string;
  photoUrl: string;
  publicPhone?: string;
  publicEmail?: string;
  showPublicPhone: boolean;
  showPublicEmail: boolean;
  officeAvailability?: string;
  isPublished: boolean;
  displayOrder: number;
  updatedAt?: unknown;
}

export interface PublicNotice {
  id: string;
  title: string;
  body: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type GalleryCategory =
  | 'Computer Lab'
  | 'Classroom'
  | 'Infrastructure'
  | 'Students'
  | 'Events'
  | 'Activities'
  | 'Faculty'
  | 'Other';

export interface GalleryMedia {
  id: string;
  title: string;
  description: string;
  category: GalleryCategory | string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  storagePath?: string;
  altText: string;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt?: unknown;
}

export interface Enquiry {
  id: string;
  referenceNumber: string;
  applicantName: string;
  phone: string;
  email?: string;
  interestedCourse: string;
  preferredBatch?: string;
  qualification?: string;
  message?: string;
  consentGiven: boolean;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  internalNotes?: string;
  createdAt?: unknown;
}

export interface AdmissionApplication {
  id: string;
  applicationId: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'correction_requested';
  internalNotes?: string;
  issuedRollNumber?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type StaffRole = 'managing_director' | 'head_teacher' | 'teacher' | 'staff';

export interface TeacherPermissions {
  viewStudents: boolean;
  markAttendance: boolean;
  editAttendance: boolean;
  uploadMaterials: boolean;
  createAssignments: boolean;
  createTests: boolean;
  publishTests: boolean;
  viewResults: boolean;
  publishAnnouncements: boolean;
}

export interface StaffProfile {
  id: string;
  uid?: string;
  email: string;
  phone?: string;
  name: string;
  role: StaffRole;
  designation: string;
  qualification?: string;
  assignedCourseIds: string[];
  assignedBatchIds: string[];
  permissions: TeacherPermissions;
  isActive: boolean;
  inviteKey?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentProfile {
  id: string;
  uid?: string;
  rollNumber: string;
  studentIdCode: string;
  applicationId?: string;
  name: string;
  fatherOrGuardianName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  qualification?: string;
  photoUrl?: string;
  courseId?: string;
  courseName: string;
  batchId?: string;
  batchName?: string;
  academicSession?: string;
  admissionDate?: string;
  status: 'approved' | 'active' | 'suspended' | 'completed';
  activationCode?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  courseId?: string;
  batchId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  remarks?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  courseId: string;
  batchId?: string;
  moduleName: string;
  fileType: 'pdf' | 'practical' | 'notes' | 'link';
  fileUrl: string;
  isPublished: boolean;
  uploadedBy: string;
  createdAt?: unknown;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  batchId?: string;
  dueDate: string;
  maxMarks: number;
  isPublished: boolean;
  createdBy: string;
  createdAt?: unknown;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  submissionText: string;
  attachmentUrl?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  submittedAt?: unknown;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  marks: number;
}

export interface Examination {
  id: string;
  title: string;
  description: string;
  courseId: string;
  batchId?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  scheduledDate: string;
  questions: MCQQuestion[];
  isPublished: boolean;
  createdBy: string;
  createdAt?: unknown;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  courseId?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  answers?: Record<string, number>;
  submittedAt?: unknown;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  courseName: string;
  totalFee: number;
  discount: number;
  scholarship: number;
  netFee: number;
  amountPaid: number;
  balanceDue: number;
  dueDate?: string;
  installmentPlan?: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  updatedAt?: unknown;
}

export interface Payment {
  id: string;
  feeRecordId: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  receiptNumber: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  remarks?: string;
  recordedBy: string;
  createdAt?: unknown;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  reference?: string;
  recordedBy: string;
  createdAt?: unknown;
}

export interface CertificateRecord {
  id: string;
  certificateId: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  courseName: string;
  issueDate: string;
  grade: string;
  status: 'valid' | 'revoked';
  revokeReason?: string;
  issuedBy?: string;
  createdAt?: unknown;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'normal' | 'important' | 'urgent';
  audience: 'all_students' | 'course' | 'batch' | 'teachers' | 'staff' | 'all_internal';
  targetCourseId?: string;
  targetBatchId?: string;
  isPinned: boolean;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  expiresAt?: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  targetId?: string;
  details: string;
  createdAt?: unknown;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
