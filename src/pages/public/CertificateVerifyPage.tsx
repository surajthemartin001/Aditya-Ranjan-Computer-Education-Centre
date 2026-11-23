import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { verifyPublicCertificate } from '../../services/firestoreService';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function CertificateVerifyPage({ data }: { data: PublicInstituteState }) {
  const { settings } = data;
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [certId, setCertId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<{
    certificateId: string;
    studentName: string;
    rollNumber: string;
    courseName: string;
    issueDate: string;
    grade: string;
    status: 'valid' | 'revoked';
  } | null>(null);

  const runLookup = async (idToLookup: string) => {
    const clean = idToLookup.trim();
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await verifyPublicCertificate(clean);
      setResult(found);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      void runLookup(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runLookup(certId);
  };

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Official Verification Registry</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Certificate Verification
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Enter an official {settings.instituteName} Certificate ID (or scan a certificate QR code) to verify authenticity. Only limited verification details are shown publicly.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Enter Certificate ID (e.g., ARCEC-CERT-2026-123456)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>

        {searched && !loading && (
          <div className="mt-6">
            {result ? (
              <div
                className={`bg-white border rounded-xl p-6 sm:p-8 ${
                  result.status === 'valid' ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === 'valid' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      {result.status === 'valid'
                        ? 'Valid Institute Certificate'
                        : 'Certificate Revoked'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verified against {settings.instituteName} official registry
                    </p>
                  </div>
                </div>

                <dl className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Certificate ID</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                      {result.certificateId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd
                      className={`mt-0.5 font-medium ${
                        result.status === 'valid' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {result.status === 'valid' ? 'Valid & Active' : 'Revoked by Management'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Student Name</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{result.studentName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Roll Number</dt>
                    <dd className="mt-0.5 font-mono text-slate-900">{result.rollNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Course Completed</dt>
                    <dd className="mt-0.5 text-slate-900">{result.courseName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Grade & Issue Date</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-slate-900">
                      {result.grade} · {result.issueDate}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <XCircle className="w-7 h-7 text-red-700 mx-auto" />
                <h2 className="mt-3 text-base font-semibold text-slate-900">
                  No Matching Certificate Found
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Verify the Certificate ID spelling or contact the institute office at +91{' '}
                  {settings.contactPhone}.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
