import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function TimetablePage({ data }: { data: PublicInstituteState }) {
  const { settings, batches } = data;

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Published Class Schedule</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Institute Timetable
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Published batch timings for theory classes, computer lab practical sessions, typing practice, and afternoon special support classes.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Batch / Program</th>
                  <th className="py-3.5 px-6">Course</th>
                  <th className="py-3.5 px-6">Theory Timing</th>
                  <th className="py-3.5 px-6">Practical / Lab Timing</th>
                  <th className="py-3.5 px-6">Room / Location</th>
                  <th className="py-3.5 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-6 font-semibold text-slate-900">{batch.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{batch.courseCode}</td>
                    <td className="py-4 px-6 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {batch.theoryTime}
                    </td>
                    <td className="py-4 px-6 font-mono tabular-nums text-blue-700 font-medium whitespace-nowrap">
                      {batch.practicalTime}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{batch.classroom || 'Main Center'}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs">
                      {batch.scheduleNote || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Need batch availability confirmation?</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Timings marked &ldquo;To be configured&rdquo; are updated directly by Management once finalized. Submit an enquiry to express your preferred batch.
              </p>
            </div>
          </div>
          <Link
            to="/enquiry"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            Submit Enquiry
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
