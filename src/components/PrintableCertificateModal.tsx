import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X } from 'lucide-react';
import type { CertificateRecord, WebsiteSettings } from '../types/models';
import { DEFAULT_WEBSITE_SETTINGS } from '../data/verifiedDefaults';

interface Props {
  certificate: CertificateRecord;
  settings?: WebsiteSettings;
  onClose: () => void;
}

export function PrintableCertificateModal({
  certificate,
  settings = DEFAULT_WEBSITE_SETTINGS,
  onClose,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/verify-certificate?id=${encodeURIComponent(
      certificate.certificateId
    )}`;
    QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [certificate.certificateId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl max-w-3xl w-full overflow-hidden border border-slate-200 my-6">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print">
          <div>
            <p className="text-xs text-slate-500">Official Certificate Preview</p>
            <h2 className="text-sm font-semibold font-mono text-slate-900">
              {certificate.certificateId}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Document Surface */}
        <div className="p-8 sm:p-12 bg-white">
          <div className="border-2 border-slate-900 p-6 sm:p-10">
            <div className="border border-slate-300 p-6 sm:p-8 text-center">
              <p className="text-xs tracking-widest uppercase text-blue-700 font-semibold">
                Established {settings.establishedYear} · Simrahi Bazar, Supaul, Bihar
              </p>
              <h1 className="mt-2 font-editorial text-2xl sm:text-3xl font-bold text-slate-950">
                {settings.instituteName}
              </h1>
              <p className="mt-1 text-xs text-slate-500">{settings.address}</p>

              <div className="my-6 border-t border-b border-slate-200 py-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Certificate of Course Completion
                </p>
              </div>

              <p className="text-sm text-slate-600">This is to certify that</p>
              <p className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-slate-950">
                {certificate.studentName}
              </p>
              <p className="mt-2 text-xs font-mono text-slate-600">
                Roll Number: {certificate.rollNumber}
              </p>

              <p className="mt-5 text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
                has successfully completed the academic requirements and practical training for the program{' '}
                <strong className="text-slate-950">{certificate.courseName}</strong> with grade{' '}
                <strong className="font-mono text-slate-950">{certificate.grade}</strong>.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-left">
                <div>
                  <p className="text-xs text-slate-500">Certificate ID</p>
                  <p className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                    {certificate.certificateId}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Date of Issue</p>
                  <p className="text-xs font-mono text-slate-900 mt-0.5">
                    {certificate.issueDate}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Certificate Verification QR Code"
                      className="w-24 h-24 border border-slate-200 p-1"
                    />
                  )}
                  <span className="text-[10px] text-slate-500 mt-1">
                    Scan to Verify Authenticity
                  </span>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {settings.managingDirector}
                  </p>
                  <p className="text-xs text-slate-500">
                    Managing Director ({settings.directorQualification})
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Status: {certificate.status === 'valid' ? 'Valid' : 'Revoked'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
