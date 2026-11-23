import { Phone, Mail, Clock, BookOpen } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function FacultyPage({ data }: { data: PublicInstituteState }) {
  const { settings, faculty } = data;

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Teaching & Guidance</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Faculty & Instructors
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Public faculty directory for visitors and enrolled students. Only Management-approved public contact details are displayed here.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {faculty.map((member) => (
            <article
              key={member.id}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                <ImageWithFallback
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-editorial text-2xl font-semibold text-slate-950">
                  {member.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-blue-700">{member.designation}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Qualification: {member.qualification}
                  {member.specialization ? ` · ${member.specialization}` : ''}
                </p>

                <p className="mt-3.5 text-sm text-slate-600 leading-relaxed">{member.bio}</p>

                {member.subjectsTaught && member.subjectsTaught.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 text-xs text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">Subjects:</strong>{' '}
                      {member.subjectsTaught.join(', ')}
                    </span>
                  </div>
                )}

                {member.officeAvailability && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{member.officeAvailability}</span>
                  </div>
                )}

                {/* Management-Controlled Public Contact Options */}
                {(member.showPublicPhone && member.publicPhone) ||
                (member.showPublicEmail && member.publicEmail) ? (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                    {member.showPublicPhone && member.publicPhone && (
                      <a
                        href={`tel:${member.publicPhone}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors font-mono tabular-nums"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call +91 {member.publicPhone}</span>
                      </a>
                    )}
                    {member.showPublicEmail && member.publicEmail && (
                      <a
                        href={`mailto:${member.publicEmail}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Teacher</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    Contact through the main institute office (+91 {settings.contactPhone}).
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
