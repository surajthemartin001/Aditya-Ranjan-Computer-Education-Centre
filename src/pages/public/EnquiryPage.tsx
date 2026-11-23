import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { submitPublicEnquiry } from '../../services/firestoreService';
import { useToast } from '../../components/ToastContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function EnquiryPage({ data }: { data: PublicInstituteState }) {
  const { settings, courses, batches } = data;
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const initialCourse = searchParams.get('course') || courses[0]?.code || 'ADCA';

  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestedCourse, setInterestedCourse] = useState(initialCourse);
  const [preferredBatch, setPreferredBatch] = useState('');
  const [qualification, setQualification] = useState('');
  const [message, setMessage] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      showToast('Please confirm consent to submit your enquiry.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const refId = await submitPublicEnquiry({
        applicantName,
        phone,
        email,
        interestedCourse,
        preferredBatch,
        qualification,
        message,
        consentGiven,
      });
      setReferenceNumber(refId);
      showToast(`Enquiry submitted! Reference: ${refId}`, 'success');
    } catch {
      showToast('Unable to save enquiry right now. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">No Login Required</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Online Admission Enquiry
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Submit an enquiry about courses, fees, or batch timings. Submitting an enquiry does not create a student account; Management reviews all enquiries internally.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {referenceNumber ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                  Enquiry Submitted Successfully
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your enquiry has been recorded in the {settings.instituteName} database for Management review.
                </p>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                  <p className="text-xs text-slate-500">Enquiry Reference Number</p>
                  <p className="mt-1 text-lg font-mono font-semibold text-slate-950">
                    {referenceNumber}
                  </p>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Please note this reference number. Ready to submit a formal admission request? You may proceed to the detailed Admission Application form.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/admission"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                  >
                    Proceed to Admission Application
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceNumber(null);
                      setApplicantName('');
                      setPhone('');
                      setEmail('');
                      setMessage('');
                      setConsentGiven(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Applicant Name *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Full name of student"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit contact number"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Educational Qualification
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g., 10th, 12th, Graduation"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Interested Course *
                </label>
                <select
                  required
                  value={interestedCourse}
                  onChange={(e) => setInterestedCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.name} ({c.feeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Preferred Batch (Optional)
                </label>
                <select
                  value={preferredBatch}
                  onChange={(e) => setPreferredBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                >
                  <option value="">Any available batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={`${b.name} (${b.theoryTime})`}>
                      {b.name} — {b.theoryTime}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Message or Question
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share any questions regarding course syllabus, timing, or admission process..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                I consent to submit this enquiry to {settings.instituteName} for admission guidance. I understand that submitting an enquiry does not automatically grant Student Portal access.
              </span>
            </label>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Admission Enquiry'}
              </button>
              <Link to="/admission" className="text-sm font-medium text-blue-700 hover:underline">
                Want to submit a full Admission Application instead? →
              </Link>
            </div>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
