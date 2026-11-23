# Security Specification — Aditya Ranjan Computer Education Center

## 1. Data Invariants
1. Public visitors can only read explicitly published institutional resources (`websiteSettings`, published `websiteContent`, published active `courses`, public `batches`, published `publicFaculty`, published `publicNotices`, published `galleryMedia`, and individual `publicCertificates` by exact Certificate ID).
2. Public visitors can submit `enquiries` and `admissionApplications`, strictly forced to initial statuses (`status: "new"` and `status: "pending"`), with zero read/list/update/delete access.
3. Submitting an `admissionApplication` NEVER creates or grants access to `studentProfiles` or private portal data.
4. Students can ONLY read their own `studentProfiles`, `attendance`, `feeRecords`, `payments`, `results`, `assignmentSubmissions`, and `certificates` when `uid == request.auth.uid` and their account is active/approved (never suspended).
5. Students can NEVER modify `attendance`, `feeRecords`, `payments`, `certificates`, `staffProfiles`, or `studentProfiles.status` / `rollNumber` / `courseId`.
6. Private `announcements` are NEVER publicly readable and require authentication.
7. Teachers can ONLY access academic operations permitted by their Management-assigned `staffProfiles/{uid}.permissions` flags and can NEVER create admin accounts, edit institute settings, or alter financial ledgers.
8. Managing Director (`isAdmin()`) is verified via `admins/{uid}` OR verified bootstrap email (`email_verified == true`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unapproved Student Self-Registration**: Public user writes directly to `/studentProfiles/fake1` with `status: "active"`.
2. **Application Auto-Approval**: Public applicant submits `/admissionApplications/app1` with `status: "approved"` instead of `"pending"`.
3. **Cross-Student PII Read**: Student A attempts `get` on `/studentProfiles/studentB` or `list` on `/studentProfiles`.
4. **Student Fee Tampering**: Student A attempts `update` on `/feeRecords/feeA` setting `balanceDue: 0, status: "paid"`.
5. **Student Attendance Forgery**: Student A attempts `create` or `update` on `/attendance/att1` setting `status: "present"`.
6. **Public Private-Announcement Scrape**: Unauthenticated visitor attempts `list` on `/announcements`.
7. **Shadow Field Injection on Application**: Public visitor injects `isAdmin: true` or `issuedRollNumber: "ARCEC-9999"` into `/admissionApplications/app2`.
8. **Role Escalation via Staff Profile**: Teacher attempts `update` on `/staffProfiles/{teacherUid}` changing `role: "managing_director"`.
9. **Unverified Admin Email Spoof**: Caller with matching email string but `email_verified: false` attempts admin write to `/courses/adca`.
10. **ID Poisoning**: Caller attempts write to `/enquiries/<200-char-invalid-chars>` failing `isValidId()`.
11. **Public Certificate Enumeration**: Unauthenticated visitor attempts `list` on `/publicCertificates` instead of `get` by exact certificate ID.
12. **Suspended Student Access**: Student with `status: "suspended"` attempts to update their profile or submit an exam result.
