import { useEffect, useMemo, useState } from 'react';
import { Search, X, Play } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import type { PublicInstituteState } from '../../hooks/usePublicInstituteData';
import type { GalleryMedia } from '../../types/models';

const CATEGORIES = [
  'All',
  'Computer Lab',
  'Classroom',
  'Infrastructure',
  'Students',
  'Events',
  'Activities',
  'Faculty',
  'Other',
];

export function GalleryPage({ data }: { data: PublicInstituteState }) {
  const { settings, gallery } = data;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  const [lightboxItem, setLightboxItem] = useState<GalleryMedia | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    return gallery.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const textMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [gallery, selectedCategory, search]);

  const visibleItems = filtered.slice(0, visibleCount);

  return (
    <PublicLayout settings={settings}>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-medium text-blue-700">Campus, Lab & Activities</p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-slate-950">
            Institute Gallery & Infrastructure
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
            Published photographs and videos of our computer laboratory, theory classrooms, infrastructure, and institute activities — accessible publicly without login.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Interactive Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(9);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gallery..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
            />
          </div>
        </div>

        {/* Media Grid */}
        {visibleItems.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-xl mt-8">
            <p className="text-sm text-slate-600">No published gallery media matches this filter.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxItem(item)}
                className="group text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {item.mediaType === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                      <Play className="w-10 h-10 text-white/90" />
                      <span className="mt-2 text-xs text-slate-300">Click to play video</span>
                    </div>
                  ) : (
                    <ImageWithFallback
                      src={item.mediaUrl}
                      alt={item.altText || item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-500">
                    {item.category} · {item.mediaType === 'video' ? 'Video' : 'Photo'}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h2>
                  {item.description && (
                    <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {visibleCount < filtered.length && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 9)}
              className="px-5 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Load More Media ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">{lightboxItem.category}</p>
                <h3 className="text-base font-semibold text-slate-900">{lightboxItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Close preview"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 max-h-[70vh] flex items-center justify-center overflow-hidden">
              {lightboxItem.mediaType === 'video' ? (
                <video
                  src={lightboxItem.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-full"
                />
              ) : (
                <ImageWithFallback
                  src={lightboxItem.mediaUrl}
                  alt={lightboxItem.altText || lightboxItem.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
            </div>
            {lightboxItem.description && (
              <div className="p-5 text-sm text-slate-600">{lightboxItem.description}</div>
            )}
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
