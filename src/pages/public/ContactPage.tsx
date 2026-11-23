import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink, CheckCircle2 } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { submitPublicEnquiry } from '../../services/firestoreService';
import { useToast } from '../../components/ToastContext';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function ContactPage({ data }: { data: PublicInstituteState }) {
  const { settings, faculty, courses } = data;
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState(courses[0]?.code || 'ADCA');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Please enter your name and phone number.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const refId = await submitPublicEnquiry({
        applicantName: name,
        phone,
        email,
        interestedCourse: course,
        message: message || 'General contact message from Contact page.',
        consentGiven: true,
      });
      setRefNumber(refId);
      showToast('Your message has been submitted to Institute Management.', 'success');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch {
      showToast('Could not submit contact form. Please check your connection and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Center Location & Helpdesk</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Contact & Location
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Visit {settings.instituteName} in Simrahi Bazar, Supaul, or send an online enquiry directly to our admission desk.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Verified Contact Info & Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-editorial text-xl font-semibold text-slate-950">
              Official Center Details
            </h2>
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-blue-700 shrink-0" />
              <a
                href={`tel:${settings.contactPhone}`}
                className="font-mono tabular-nums font-medium text-slate-900 hover:text-blue-700"
              >
                +91 {settings.contactPhone}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-blue-700 shrink-0" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-slate-800 hover:text-blue-700 break-all"
              >
                {settings.contactEmail}
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span>Open Google Maps Location</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900">Published Faculty Contacts</h3>
            <p className="mt-1 text-xs text-slate-500">
              Management-approved public contact numbers and emails.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              {faculty.map((f) => (
                <div key={f.id} className="py-3 text-sm">
                  <p className="font-medium text-slate-900">
                    {f.name} · <span className="text-xs text-slate-500">{f.designation}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs">
                    {f.showPublicPhone && f.publicPhone && (
                      <a href={`tel:${f.publicPhone}`} className="font-mono text-blue-700 hover:underline">
                        +91 {f.publicPhone}
                      </a>
                    )}
                    {f.showPublicEmail && f.publicEmail && (
                      <a href={`mailto:${f.publicEmail}`} className="text-slate-600 hover:text-blue-700">
                        {f.publicEmail}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Contact Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <h2 className="font-editorial text-2xl font-semibold text-slate-950">Send a Message</h2>
          <p className="mt-1 text-sm text-slate-600">
            Have a question about courses, fees, or batch timings? Reach our office directly. For formal admission applications, use the{' '}
            <Link to="/admission" className="text-blue-700 font-medium hover:underline">
              Admission Application form
            </Link>
            .
          </p>

          {refNumber ? (
            <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-emerald-950">Message Received</h3>
                  <p className="mt-1 text-sm text-emerald-900">
                    Reference Number:{' '}
                    <span className="font-mono font-semibold">{refNumber}</span>
                  </p>
                  <p className="mt-2 text-xs text-emerald-800">
                    Saved securely for Management review. You may also call +91 {settings.contactPhone} during institute hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRefNumber(null)}
                    className="mt-4 px-4 py-2 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
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
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Topic / Interested Course
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Message or Question *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your question about timings, courses, or admission..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
