import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { submitAdmissionApplication } from '../../services/firestoreService';
import { useToast } from '../../components/ToastContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function AdmissionApplicationPage({ data }: { data: PublicInstituteState }) {
  const { settings, courses, batches } = data;
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const initialCourseId = searchParams.get('course') || courses[0]?.id || 'course-adca';

  const [fullName, setFullName] = useState('');
  const [fatherOrGuardianName, setFatherOrGuardianName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [preferredBatch, setPreferredBatch] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const appId = await submitAdmissionApplication({
        fullName,
        fatherOrGuardianName,
        dateOfBirth,
        phone,
        email,
        address,
        qualification,
        selectedCourseId: selectedCourse?.id || '',
        selectedCourseName: selectedCourse ? `${selectedCourse.code} — ${selectedCourse.name}` : 'ADCA',
        preferredBatch,
        documentNotes,
      });
      setApplicationId(appId);
      showToast(`Admission application submitted (${appId}). Status: Pending review.`, 'success');
    } catch {
      showToast('Failed to submit application. Please verify all fields and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Step 1 of Approval-Based Admission</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Online Admission Application
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Submit your admission application without creating an account. All applications begin with status <strong>Pending</strong> until reviewed and approved by Institute Management.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {applicationId ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                  Application Submitted — Status: Pending
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Your application has been saved securely for Management review. Please save your Application ID below and visit the institute admission desk with your verification documents.
                </p>

                <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                  <p className="text-xs text-slate-500">Application ID</p>
                  <p className="mt-1 text-xl font-mono font-semibold text-slate-950">
                    {applicationId}
                  </p>
                </div>

                <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed">
                  <strong>Important:</strong> Submitting an application does not automatically grant Student Portal access. After Management approves your application, you will receive your official Roll Number and Activation Code at the institute to activate your Student Portal account.
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                  >
                    Return to Home
                  </Link>
                  <Link
                    to="/courses"
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 text-xs text-slate-700">
              <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                Applications are stored with status <strong>Pending</strong>. Only after Management verifies your details and approves admission will a Roll Number and Student Portal activation code be issued.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As on academic records"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Father / Guardian Name
                </label>
                <input
                  type="text"
                  value={fatherOrGuardianName}
                  onChange={(e) => setFatherOrGuardianName(e.target.value)}
                  placeholder="Father or guardian name"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Full Residential Address *
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Village/Ward, Post, Block, District, PIN Code"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Educational Qualification *
                </label>
                <input
                  type="text"
                  required
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g., 10th / 12th / B.A. / B.Sc"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Selected Course *
                </label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.duration} ({c.feeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Preferred Batch
                </label>
                <select
                  value={preferredBatch}
                  onChange={(e) => setPreferredBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                >
                  <option value="">Management to assign</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.theoryTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Verification Documents Checklist / Notes
              </label>
              <input
                type="text"
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                placeholder="e.g., Passport photo, Aadhaar copy, last marksheet ready for office verification"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting Application...' : 'Submit Admission Application'}
              </button>
            </div>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
