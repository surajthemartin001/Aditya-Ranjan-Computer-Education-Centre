# Aditya Ranjan Computer Education Center — Official Web Platform

**Established:** 2017  
**Address:** High School Road, Simrahi Bazar, Supaul, Bihar, India – 852111  
**Managing Director:** Ajay Kumar, B.Sc (IT)  
**Contact:** +91 9199795524 | Adityranjancompedu@gmail.com

---

## Architecture Overview

This unified React + TypeScript + Firebase (Authentication, Cloud Firestore, Firebase Storage) web application delivers **exactly two portal entry points** on one centralized database:

1. **Portal 1 — Public Website + Approval-Based Student Portal**
   - **Public Mode (No Login Required):** Home, About, Courses (ADCA, DCA, TALLY, DTA, Hindi & English Typing), Fees Structure, Public Faculty Directory with Management-controlled contact visibility, Timetable, Gallery, Public Notices, Contact & Location, Online Admission Enquiry, Admission Application, and Public QR Certificate Verification.
   - **Student Mode (Approved & Active Students Only):** Roll Number + Password (or linked Google) login after Management approves the application and issues an official Roll Number and one-time Activation Code. Provides Student Dashboard, Profile, Syllabus & Study Materials, Assignments, Online MCQ Tests with automatic evaluation, Attendance (read-only), Fees & Printable Receipts (read-only), QR Certificates, and Internal Announcement Center.

2. **Portal 2 — Unified Management & Teacher Portal (`/login/staff`)**
   - **Managing Director Dashboard (`/management`):** Full institutional administration (Enquiries, Admission Approvals & Roll Number Issuance, Student Status Management, Teachers & Granular Permissions, Courses, Batches & Timetable, Attendance, Study Materials, Assignments, MCQ Exams, Fees/Payments/Receipts, Basic Income & Expense Financials, QR Certificates, Internal Announcement Manager, Public Notices, Website CMS & Settings, Media & Gallery Manager, Audit Activity Logs, and CSV Exports).
   - **Teacher Dashboard (`/teacher`):** Role- and permission-gated workspace controlled exclusively by Management.

---

## Strict Institutional & Security Rules

- **Zero External Messaging:** No SMS, SMS OTP, WhatsApp Business API, Gmail API, or automated external email notifications are implemented. All announcements and unread notifications operate strictly inside the website.
- **Public / Private Separation:** Private student records, attendance, fees, results, and internal announcements are strictly blocked from public access by `firestore.rules`.
- **Approval-Based Student Access:** Submitting an admission enquiry or application never creates a student account. Only Management approval generates a Roll Number and Activation Code.
- **No Hardcoded Credentials:** Zero passwords or private service account keys exist in source code.

---

## Setup & Deployment Guide

1. **Dependencies:** Run `npm install` and verify with `npm run build` and `npm run lint`.
2. **Firebase Provisioning:** Connected to Cloud Firestore database configured in `firebase-applet-config.json`.
3. **Enabling Roll Number + Password Auth (Optional Console Step):**
   - Google Sign-In works immediately out-of-the-box for Managing Director, invited Teachers, and Student account linking.
   - To enable Roll Number + Password (`Email/Password` provider) for students and staff, open **Firebase Console → Authentication → Sign-in method → Enable Email/Password**.
4. **First-Time Managing Director Initialization:**
   - Sign in at `/login/staff` using the authorized owner Google account, then click **Initialize Verified Data in Firestore** on the Overview dashboard to seed all verified courses, timetable slots, faculty, notices, gallery, and settings into Firestore.
5. **Deploying Firestore Security Rules:**
   - Validate rules with `npx eslint firestore.rules` and deploy via Firebase CLI (`firebase deploy --only firestore:rules`) or AI Studio Firebase integration.

---

## Firestore & Storage Backup Strategy

GitHub source-code synchronization backs up application code only — **it does NOT back up Firestore records or Firebase Storage media**.

1. **Scheduled Firestore Exports:** Configure automated daily/weekly exports to a dedicated Google Cloud Storage bucket via `gcloud firestore export gs://<backup-bucket>/firestore-backups/$(date +%Y-%m-%d)`.
2. **CSV Institutional Snapshots:** Use the built-in CSV export actions inside the Management Portal (Students, Enquiries, Admissions, Attendance, Exam Results, Fee Ledgers, Financials) for regular local administrative archival.
3. **Recovery Drill:** Verify restores into a staging database periodically before relying on backups for production recovery.

---

## Quality & Security Verification Checklist

- [x] All public pages open cleanly without login (Hindi & English toggle verified)
- [x] Admission Enquiry and Admission Application write to Firestore without creating student access
- [x] Pending, rejected, and suspended applicants are blocked by `firestore.rules` and `AuthContext`
- [x] Management approval atomically issues Roll Number, Student ID, Fee Ledger, and compound Activation Code
- [x] Public Faculty page only displays Management-approved phone/email fields
- [x] Internal announcements are strictly inaccessible to unauthenticated visitors
- [x] `firestore.rules` passes `@firebase/eslint-plugin-security-rules` with zero errors
