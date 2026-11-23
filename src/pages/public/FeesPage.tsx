import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/PublicLayout';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function FeesPage({ data }: { data: PublicInstituteState }) {
  const { settings, courses } = data;

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Transparent Academic Information</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Course Fees Structure
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Current published course fees for {settings.instituteName}. Fee notes and payment policies are managed directly by Institute Management.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Course</th>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6 text-right">Published Fee</th>
                  <th className="py-3.5 px-6">Remarks</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-6 font-medium text-slate-900">{course.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{course.code}</td>
                    <td className="py-4 px-6 font-mono tabular-nums text-slate-700">
                      {course.duration}
                    </td>
                    <td className="py-4 px-6 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {course.feeLabel}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs">
                      {course.feeNote || 'Confirm details at admission desk.'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/enquiry?course=${encodeURIComponent(course.code)}`}
                        className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
                      >
                        Enquire →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">Fee Description & Policy</h2>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              {settings.feePolicyNote}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">Payment Options</h2>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              {settings.paymentOptionsNote}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">Installment Information</h2>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              {settings.installmentNote}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">Discounts & Scholarships</h2>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              {settings.scholarshipNote}
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
