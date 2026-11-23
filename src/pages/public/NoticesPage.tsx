import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';

export function NoticesPage({ data }: { data: PublicInstituteState }) {
  const { settings, notices } = data;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    notices.forEach((n) => set.add(n.category || 'General'));
    return Array.from(set);
  }, [notices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices.filter((n) => {
      const catOk = category === 'All' || n.category === category;
      const qOk =
        !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [notices, category, search]);

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Official Public Board</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Public Notices & Announcements
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Announcements explicitly marked by Management for public viewing. Private student notices remain strictly inside the authenticated Student Portal.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  category === cat
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              No public notices match your search.
            </div>
          ) : (
            filtered.map((notice) => (
              <article
                key={notice.id}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                  <span className="font-sans font-medium text-slate-700">{notice.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{notice.publishedDate}</span>
                  {notice.isPinned && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans font-semibold text-blue-700">Pinned Notice</span>
                    </>
                  )}
                </div>
                <h2 className="mt-2 font-editorial text-xl font-semibold text-slate-950">
                  {notice.title}
                </h2>
                <p className="mt-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {notice.body}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
