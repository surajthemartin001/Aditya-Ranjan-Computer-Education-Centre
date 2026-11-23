import React, { useRef, useState } from 'react';
import { Plus, Save, Trash2, Upload, X } from 'lucide-react';
import type { UploadTask } from 'firebase/storage';
import {
  deleteStorageFile,
  logActivity,
  makeSafeId,
  removeDocument,
  saveDocument,
  uploadMediaFile,
} from '../../../services/firestoreService';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useToast } from '../../../components/ToastContext';
import type {
  Announcement,
  Batch,
  Course,
  GalleryCategory,
  GalleryMedia,
  PublicNotice,
  WebsiteContent,
  WebsiteSettings,
} from '../../../types/models';

const GALLERY_CATEGORIES: GalleryCategory[] = [
  'Computer Lab',
  'Classroom',
  'Infrastructure',
  'Students',
  'Events',
  'Activities',
  'Faculty',
  'Other',
];

interface Props {
  subTab: 'announcements' | 'cms' | 'media';
  announcements: Announcement[];
  publicNotices: PublicNotice[];
  gallery: GalleryMedia[];
  settings: WebsiteSettings;
  content: Record<string, WebsiteContent>;
  courses: Course[];
  batches: Batch[];
  actorUid: string;
  actorName: string;
  onRefresh: () => Promise<void>;
}

export function CmsMediaAnnouncementsSection({
  subTab,
  announcements,
  publicNotices,
  gallery,
  settings,
  content,
  courses,
  batches,
  actorUid,
  actorName,
  onRefresh,
}: Props) {
  const { showToast, confirmAction } = useToast();

  // Internal announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annCategory, setAnnCategory] = useState('Academic');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('normal');
  const [annAudience, setAnnAudience] = useState<Announcement['audience']>('all_students');
  const [annCourseId, setAnnCourseId] = useState('');
  const [annBatchId, setAnnBatchId] = useState('');
  const [annStatus, setAnnStatus] = useState<Announcement['status']>('published');
  const [annPinned, setAnnPinned] = useState(false);

  // Public notice form (strictly separated)
  const [pubTitle, setPubTitle] = useState('');
  const [pubBody, setPubBody] = useState('');
  const [pubCategory, setPubCategory] = useState('Admissions');
  const [pubPinned, setPubPinned] = useState(false);

  // CMS & Settings form
  const [sName, setSName] = useState(settings.instituteName);
  const [sAddress, setSAddress] = useState(settings.address);
  const [sPhone, setSPhone] = useState(settings.contactPhone);
  const [sEmail, setSEmail] = useState(settings.contactEmail);
  const [sMaps, setSMaps] = useState(settings.mapsUrl);
  const [sFeePolicy, setSFeePolicy] = useState(settings.feePolicyNote);
  const [sPayOpts, setSPayOpts] = useState(settings.paymentOptionsNote);
  const [sInstallment, setSInstallment] = useState(settings.installmentNote);
  const [sScholarship, setSScholarship] = useState(settings.scholarshipNote);
  const [homeTitle, setHomeTitle] = useState(content.home?.heroTitle || '');
  const [homeTitleHi, setHomeTitleHi] = useState(content.home?.heroTitleHi || '');
  const [homeSubtitle, setHomeSubtitle] = useState(content.home?.heroSubtitle || '');
  const [aboutBody, setAboutBody] = useState(content.about?.body || '');

  // Media & Gallery Manager state
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mCategory, setMCategory] = useState<GalleryCategory>('Computer Lab');
  const [mType, setMType] = useState<'image' | 'video'>('image');
  const [mUrl, setMUrl] = useState('');
  const [mStoragePath, setMStoragePath] = useState('');
  const [mAlt, setMAlt] = useState('');
  const [mFeatured, setMFeatured] = useState(false);
  const [mPublished, setMPublished] = useState(true);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);

  const handleSaveInternalAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = makeSafeId('ANN');
    try {
      await saveDocument('announcements', id, {
        title: annTitle.trim(),
        body: annBody.trim(),
        category: annCategory,
        priority: annPriority,
        audience: annAudience,
        targetCourseId: annCourseId,
        targetBatchId: annBatchId,
        isPinned: annPinned,
        status: annStatus,
        createdBy: actorUid,
      });
      showToast(
        'Internal announcement saved. Delivered strictly inside the website portal (zero SMS/WhatsApp/email).',
        'success'
      );
      setAnnTitle('');
      setAnnBody('');
      await onRefresh();
    } catch {
      showToast('Failed to save internal announcement.', 'error');
    }
  };

  const handleSavePublicNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = makeSafeId('PUBN');
    try {
      await saveDocument('publicNotices', id, {
        title: pubTitle.trim(),
        body: pubBody.trim(),
        category: pubCategory,
        isPinned: pubPinned,
        isPublished: true,
        publishedDate: new Date().toISOString().slice(0, 10),
      });
      showToast('Public notice published to /notices.', 'success');
      setPubTitle('');
      setPubBody('');
      await onRefresh();
    } catch {
      showToast('Failed to publish public notice.', 'error');
    }
  };

  const handleSaveCmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveDocument('websiteSettings', 'main', {
        ...settings,
        instituteName: sName.trim(),
        address: sAddress.trim(),
        contactPhone: sPhone.trim(),
        contactEmail: sEmail.trim(),
        mapsUrl: sMaps.trim(),
        feePolicyNote: sFeePolicy.trim(),
        paymentOptionsNote: sPayOpts.trim(),
        installmentNote: sInstallment.trim(),
        scholarshipNote: sScholarship.trim(),
      });

      await saveDocument('websiteContent', 'home', {
        ...(content.home || { pageKey: 'home', isVisible: true }),
        status: 'published',
        heroTitle: homeTitle.trim(),
        heroTitleHi: homeTitleHi.trim(),
        heroSubtitle: homeSubtitle.trim(),
        revisionCount: (content.home?.revisionCount || 1) + 1,
      });

      await saveDocument('websiteContent', 'about', {
        ...(content.about || { pageKey: 'about', isVisible: true }),
        status: 'published',
        body: aboutBody.trim(),
        revisionCount: (content.about?.revisionCount || 1) + 1,
      });

      await logActivity({
        action: 'PUBLISH_WEBSITE_CMS',
        module: 'CMS',
        actorUid,
        actorName,
        actorRole: 'managing_director',
        details: 'Updated website settings, homepage copy, about content, and fee policy notes.',
      });

      showToast('Website content & settings published live without code changes!', 'success');
      await onRefresh();
    } catch {
      showToast('Failed to save CMS settings.', 'error');
    }
  };

  const handleUploadGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMType(isVideo ? 'video' : 'image');
    setUploadPct(0);
    try {
      const { task, promise } = uploadMediaFile(file, 'public_gallery', (pct) => setUploadPct(pct));
      uploadTaskRef.current = task;
      const result = await promise;
      setMUrl(result.url);
      setMStoragePath(result.storagePath);
      if (!mTitle) setMTitle(file.name.replace(/\.[^.]+$/, ''));
      if (!mAlt) setMAlt(file.name.replace(/\.[^.]+$/, ''));
      showToast('Media uploaded to Firebase Storage.', 'success');
    } catch {
      showToast('Upload cancelled or Storage not enabled yet. You may also paste an image/video URL.', 'info');
    } finally {
      uploadTaskRef.current = null;
      setUploadPct(null);
    }
  };

  const handleSaveGalleryMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mUrl.trim()) {
      showToast('Upload a file or enter a media URL first.', 'error');
      return;
    }
    const id = makeSafeId('MED');
    try {
      await saveDocument('galleryMedia', id, {
        title: mTitle.trim(),
        description: mDesc.trim(),
        category: mCategory,
        mediaType: mType,
        mediaUrl: mUrl.trim(),
        storagePath: mStoragePath,
        altText: mAlt.trim() || mTitle.trim(),
        displayOrder: gallery.length + 1,
        isFeatured: mFeatured,
        isPublished: mPublished,
      });
      showToast('Gallery media added.', 'success');
      setShowAddMedia(false);
      setMTitle('');
      setMDesc('');
      setMUrl('');
      setMStoragePath('');
      setMAlt('');
      await onRefresh();
    } catch {
      showToast('Failed to save gallery media metadata.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* INTERNAL ANNOUNCEMENTS + SEPARATE PUBLIC NOTICES */}
      {subTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Private Internal Announcement Manager */}
          <div className="space-y-6">
            <form
              onSubmit={handleSaveInternalAnnouncement}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div>
                <p className="text-xs font-medium text-blue-700">
                  Strictly Internal Portal Delivery · Zero SMS / WhatsApp / Email
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Create Internal Announcement
                </h2>
              </div>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement Title *"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <textarea
                rows={4}
                required
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Write internal notice for students or staff..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={annAudience}
                  onChange={(e) => setAnnAudience(e.target.value as Announcement['audience'])}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all_students">All Approved Students</option>
                  <option value="course">Specific Course</option>
                  <option value="batch">Specific Batch</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="staff">Staff Only</option>
                  <option value="all_internal">All Internal Users</option>
                </select>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as Announcement['priority'])}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {annAudience === 'course' && (
                <select
                  value={annCourseId}
                  onChange={(e) => setAnnCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              )}

              {annAudience === 'batch' && (
                <select
                  value={annBatchId}
                  onChange={(e) => setAnnBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <select
                    value={annStatus}
                    onChange={(e) => setAnnStatus(e.target.value as Announcement['status'])}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="published">Publish Now</option>
                    <option value="draft">Save Draft</option>
                    <option value="archived">Archive</option>
                  </select>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                    />
                    <span>Pin Notice</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                >
                  Save Internal Announcement
                </button>
              </div>
            </form>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Internal Announcements ({announcements.length})
              </h3>
              <div className="divide-y divide-slate-200 text-sm">
                {announcements.map((a) => (
                  <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {a.audience} · {a.status} · {a.priority}
                      </p>
                      <p className="font-medium text-slate-900 mt-0.5">{a.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: 'Delete Internal Announcement?',
                          message: `Delete "${a.title}" permanently?`,
                          destructive: true,
                        });
                        if (ok) {
                          await removeDocument('announcements', a.id);
                          showToast('Announcement deleted.', 'info');
                          await onRefresh();
                        }
                      }}
                      className="p-1.5 text-red-600 border border-red-200 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Public Notice Manager (Strictly Separate) */}
          <div className="space-y-6">
            <form
              onSubmit={handleSavePublicNotice}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  Public Website Notice Board (/notices)
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Publish Public Notice
                </h2>
              </div>
              <input
                type="text"
                required
                value={pubTitle}
                onChange={(e) => setPubTitle(e.target.value)}
                placeholder="Public Notice Title *"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <textarea
                rows={4}
                required
                value={pubBody}
                onChange={(e) => setPubBody(e.target.value)}
                placeholder="Public announcement visible without login..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <input
                    type="text"
                    value={pubCategory}
                    onChange={(e) => setPubCategory(e.target.value)}
                    placeholder="Category"
                    className="w-32 px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={pubPinned}
                      onChange={(e) => setPubPinned(e.target.checked)}
                    />
                    <span>Pinned</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Publish to Public Board
                </button>
              </div>
            </form>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Published Public Notices ({publicNotices.length})
              </h3>
              <div className="divide-y divide-slate-200 text-sm">
                {publicNotices.map((n) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        {n.category} · {n.publishedDate}
                      </p>
                      <p className="font-medium text-slate-900 mt-0.5">{n.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeDocument('publicNotices', n.id);
                        showToast('Public notice removed.', 'info');
                        await onRefresh();
                      }}
                      className="p-1.5 text-red-600 border border-red-200 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEBSITE CONTENT CMS & SETTINGS */}
      {subTab === 'cms' && (
        <form
          onSubmit={handleSaveCmsSettings}
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-slate-950">
              Website Content Management System (CMS)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Edit institute details, bilingual homepage headlines, About text, and fee policy notes directly in Firestore without code changes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Institute Name</label>
              <input
                type="text"
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={sPhone}
                onChange={(e) => setSPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={sEmail}
                onChange={(e) => setSEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Google Maps URL</label>
              <input
                type="url"
                value={sMaps}
                onChange={(e) => setSMaps(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Address</label>
            <input
              type="text"
              value={sAddress}
              onChange={(e) => setSAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Homepage &amp; About Copy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Homepage Headline (English)
                </label>
                <input
                  type="text"
                  value={homeTitle}
                  onChange={(e) => setHomeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Homepage Headline (Hindi)
                </label>
                <input
                  type="text"
                  value={homeTitleHi}
                  onChange={(e) => setHomeTitleHi(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Homepage Subtitle
              </label>
              <textarea
                rows={2}
                value={homeSubtitle}
                onChange={(e) => setHomeSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                About Institute Narrative
              </label>
              <textarea
                rows={3}
                value={aboutBody}
                onChange={(e) => setAboutBody(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fee Policy Note</label>
              <textarea
                rows={2}
                value={sFeePolicy}
                onChange={(e) => setSFeePolicy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Options Note</label>
              <textarea
                rows={2}
                value={sPayOpts}
                onChange={(e) => setSPayOpts(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Installment Note</label>
              <textarea
                rows={2}
                value={sInstallment}
                onChange={(e) => setSInstallment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship Note</label>
              <textarea
                rows={2}
                value={sScholarship}
                onChange={(e) => setSScholarship(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
          >
            <Save className="w-4 h-4" />
            <span>Publish Changes to Public Website</span>
          </button>
        </form>
      )}

      {/* MEDIA & GALLERY MANAGER */}
      {subTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Media &amp; Gallery Management ({gallery.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload images (WebP, JPG, PNG) and videos (MP4, WebM) to Firebase Storage and publish directly to the public /gallery page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMedia(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Media</span>
            </button>
          </div>

          {showAddMedia && (
            <form
              onSubmit={handleSaveGalleryMedia}
              className="bg-white border border-blue-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Upload Gallery Media</h3>
                <button
                  type="button"
                  onClick={() => setShowAddMedia(false)}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-slate-700">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Select Image (JPG/PNG/WebP) or Video (MP4/WebM)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={handleUploadGalleryFile}
                    className="hidden"
                  />
                </label>
                {uploadPct !== null && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 transition-all"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{uploadPct}%</span>
                    <button
                      type="button"
                      onClick={() => uploadTaskRef.current?.cancel()}
                      className="text-xs text-red-700 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="Media Title *"
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as GalleryCategory)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {GALLERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="url"
                required
                value={mUrl}
                onChange={(e) => setMUrl(e.target.value)}
                placeholder="Media URL (auto-filled after upload or paste valid URL)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={mAlt}
                onChange={(e) => setMAlt(e.target.value)}
                placeholder="Accessible Alt Text"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                value={mDesc}
                onChange={(e) => setMDesc(e.target.value)}
                placeholder="Caption / description..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="flex flex-wrap items-center gap-5 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mPublished}
                    onChange={(e) => setMPublished(e.target.checked)}
                  />
                  <span>Publish to Public Gallery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mFeatured}
                    onChange={(e) => setMFeatured(e.target.checked)}
                  />
                  <span>Mark Featured</span>
                </label>
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
              >
                Save Gallery Item
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  <ImageWithFallback
                    src={item.mediaUrl}
                    alt={item.altText || item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      {item.category} · {item.isPublished ? 'Published' : 'Unpublished'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.title}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveDocument('galleryMedia', item.id, {
                          isPublished: !item.isPublished,
                        });
                        showToast(
                          item.isPublished ? 'Media unpublished.' : 'Media published.',
                          'info'
                        );
                        await onRefresh();
                      }}
                      className="text-blue-700 font-medium hover:underline"
                    >
                      {item.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: 'Delete Gallery Media?',
                          message: `Permanently delete "${item.title}"?`,
                          destructive: true,
                        });
                        if (ok) {
                          await deleteStorageFile(item.storagePath);
                          await removeDocument('galleryMedia', item.id);
                          showToast('Media deleted cleanly.', 'info');
                          await onRefresh();
                        }
                      }}
                      className="text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
