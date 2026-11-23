import React, { useState } from 'react';
import { Award, Download, IndianRupee, Plus, Printer, ShieldOff } from 'lucide-react';
import {
  exportToCsv,
  issueStudentCertificate,
  makeSafeId,
  recordFeePayment,
  saveDocument,
  toggleCertificateStatus,
} from '../../../services/firestoreService';
import { PrintableCertificateModal } from '../../../components/PrintableCertificateModal';
import { useToast } from '../../../components/ToastContext';
import type {
  CertificateRecord,
  FeeRecord,
  FinancialTransaction,
  Payment,
  StudentProfile,
  WebsiteSettings,
} from '../../../types/models';

interface Props {
  subTab: 'fees' | 'financials' | 'certificates';
  students: StudentProfile[];
  feeRecords: FeeRecord[];
  payments: Payment[];
  transactions: FinancialTransaction[];
  certificates: CertificateRecord[];
  settings: WebsiteSettings;
  actorUid: string;
  actorName: string;
  onRefresh: () => Promise<void>;
}

export function FeesFinanceCertsSection({
  subTab,
  students,
  feeRecords,
  payments,
  transactions,
  certificates,
  settings,
  actorUid,
  actorName,
  onRefresh,
}: Props) {
  const { showToast, confirmAction } = useToast();

  // Record payment modal
  const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRemarks, setPayRemarks] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);

  // Financial transaction form
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Lab Maintenance');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txDesc, setTxDesc] = useState('');

  // Certificate issue form
  const [certStudentId, setCertStudentId] = useState(students[0]?.id || '');
  const [certGrade, setCertGrade] = useState('A');
  const [certDate, setCertDate] = useState(new Date().toISOString().slice(0, 10));
  const [issuingCert, setIssuingCert] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid payment amount.', 'error');
      return;
    }
    setRecordingPay(true);
    try {
      const res = await recordFeePayment({
        feeRecord: payingFee,
        amount: amt,
        paymentMode: payMode,
        paymentDate: payDate,
        remarks: payRemarks,
        actorUid,
        actorName,
      });
      showToast(`Payment recorded! Receipt: ${res.receiptNumber}`, 'success');
      setPayingFee(null);
      setPayAmount('');
      setPayRemarks('');
      await onRefresh();
    } catch {
      showToast('Failed to record payment.', 'error');
    } finally {
      setRecordingPay(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount);
    if (!amt || amt <= 0) return;
    const id = makeSafeId('TX');
    try {
      await saveDocument('financialTransactions', id, {
        type: txType,
        category: txCategory.trim(),
        description: txDesc.trim(),
        amount: amt,
        date: txDate,
        reference: id,
        recordedBy: actorUid,
      });
      showToast(`${txType === 'income' ? 'Income' : 'Expense'} recorded.`, 'success');
      setTxAmount('');
      setTxDesc('');
      await onRefresh();
    } catch {
      showToast('Could not save transaction.', 'error');
    }
  };

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === (certStudentId || students[0]?.id));
    if (!stu) {
      showToast('Select a registered student first.', 'error');
      return;
    }
    setIssuingCert(true);
    try {
      const certId = await issueStudentCertificate({
        student: stu,
        grade: certGrade,
        issueDate: certDate,
        actorUid,
        actorName,
      });
      showToast(`Certificate issued & verified online: ${certId}`, 'success');
      await onRefresh();
    } catch {
      showToast('Could not issue certificate.', 'error');
    } finally {
      setIssuingCert(false);
    }
  };

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalOutstanding = feeRecords.reduce((s, f) => s + Number(f.balanceDue || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* FEES & PAYMENTS */}
      {subTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Fee Collected</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-emerald-700">
                ₹{totalCollected.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Outstanding Fees</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-amber-700">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Receipts Issued</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                {payments.length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Student Fee Ledgers</h2>
              <button
                type="button"
                onClick={() =>
                  exportToCsv(
                    'arcec-fee-ledgers.csv',
                    feeRecords.map((f) => ({
                      RollNumber: f.rollNumber,
                      Student: f.studentName,
                      Course: f.courseName,
                      NetFee: f.netFee,
                      Paid: f.amountPaid,
                      Balance: f.balanceDue,
                      Status: f.status,
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledgers CSV</span>
              </button>
            </div>

            {feeRecords.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Fee ledgers are automatically created when students are approved.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <th className="py-2.5 pr-4">Roll No.</th>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3 text-right">Net Fee</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feeRecords.map((f) => (
                      <tr key={f.id}>
                        <td className="py-3 pr-4 font-mono text-xs font-semibold">{f.rollNumber}</td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-slate-900">{f.studentName}</p>
                          <p className="text-xs text-slate-500">{f.courseName}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          ₹{f.netFee.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                          ₹{f.amountPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                          ₹{f.balanceDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-xs capitalize font-medium">{f.status}</td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPayingFee(f);
                              setPayAmount(String(f.balanceDue > 0 ? f.balanceDue : ''));
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Record Payment</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {payingFee && (
            <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
              <form
                onSubmit={handleRecordPayment}
                className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  Record Fee Payment — {payingFee.studentName}
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  Roll: {payingFee.rollNumber} · Balance Due: ₹{payingFee.balanceDue}
                </p>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Amount Paid (₹)"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Installment / Receipt remarks"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingFee(null)}
                    className="px-4 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingPay}
                    className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                  >
                    {recordingPay ? 'Saving...' : 'Save & Generate Receipt'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* BASIC FINANCIALS */}
      {subTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Recorded Income</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-emerald-700">
                ₹{totalIncome.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Recorded Expenses</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-red-700">
                ₹{totalExpense.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Net Institute Balance</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-slate-950">
                ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddTransaction}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">Record Income or Expense</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="text"
                required
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                placeholder="Category (e.g., Electricity, Hardware)"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                required
                min={1}
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <input
              type="text"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              placeholder="Description..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Entry</span>
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Financial Ledger ({transactions.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  exportToCsv(
                    'arcec-financials.csv',
                    transactions.map((t) => ({
                      Date: t.date,
                      Type: t.type,
                      Category: t.category,
                      Description: t.description,
                      Amount: t.amount,
                      Reference: t.reference || '',
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {transactions.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {t.category} · <span className="font-normal text-slate-600">{t.description}</span>
                    </p>
                    <p className="text-xs font-mono text-slate-500">
                      {t.date} · {t.reference}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      t.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  No financial entries recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATES */}
      {subTab === 'certificates' && (
        <div className="space-y-6">
          <form
            onSubmit={handleIssueCert}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Issue Verifiable Course Certificate
              </h2>
              <p className="text-xs text-slate-500">
                Generates a unique Certificate ID with embedded QR code pointing to /verify-certificate.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={certStudentId}
                onChange={(e) => setCertStudentId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {students.length === 0 && <option value="">No registered students yet</option>}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber} — {s.name} ({s.courseName})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={certGrade}
                onChange={(e) => setCertGrade(e.target.value)}
                placeholder="Grade (e.g., A+, A, B+)"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="date"
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={issuingCert || students.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>{issuingCert ? 'Issuing...' : 'Generate Certificate & QR Registry'}</span>
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Issued Certificates ({certificates.length})
            </h3>
            <div className="divide-y divide-slate-200 text-sm">
              {certificates.map((c) => (
                <div
                  key={c.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-700">
                      {c.certificateId} · {c.status.toUpperCase()}
                    </p>
                    <p className="font-medium text-slate-900">
                      {c.studentName} ({c.rollNumber}) — {c.courseName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Grade {c.grade} · Issued {c.issueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewCert(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Preview / Print QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const target = c.status === 'valid' ? 'revoked' : 'valid';
                        const ok = await confirmAction({
                          title: target === 'revoked' ? 'Revoke Certificate?' : 'Restore Certificate?',
                          message: `Set ${c.certificateId} status to ${target}? Public QR verification updates immediately.`,
                          destructive: target === 'revoked',
                        });
                        if (ok) {
                          await toggleCertificateStatus(
                            c,
                            target,
                            'Updated by Management',
                            actorUid,
                            actorName
                          );
                          showToast(`Certificate marked ${target}.`, 'info');
                          await onRefresh();
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>{c.status === 'valid' ? 'Revoke' : 'Restore'}</span>
                    </button>
                  </div>
                </div>
              ))}
              {certificates.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  No certificates issued yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {previewCert && (
        <PrintableCertificateModal
          certificate={previewCert}
          settings={settings}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
}
