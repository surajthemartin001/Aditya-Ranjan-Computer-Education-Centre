import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Announcement } from '../types/models';

export function NotificationBell({ onOpenAll }: { onOpenAll?: () => void }) {
  const { firebaseUser, role, studentProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;

    const load = async () => {
      try {
        const annSnap = await getDocs(
          query(collection(db, 'announcements'), where('status', '==', 'published'))
        );
        const all = annSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) })
        );

        const filtered = all.filter((a) => {
          if (a.audience === 'all_internal') return true;
          if (role === 'student') {
            if (a.audience === 'all_students') return true;
            if (a.audience === 'course' && a.targetCourseId === studentProfile?.courseId) return true;
            if (a.audience === 'batch' && a.targetBatchId === studentProfile?.batchId) return true;
            return false;
          }
          if (role === 'teacher' || role === 'head_teacher') {
            return a.audience === 'teachers' || a.audience === 'staff' || a.audience === 'all_students';
          }
          if (role === 'staff' || role === 'managing_director') {
            return true;
          }
          return false;
        });

        const readSnap = await getDocs(
          query(collection(db, 'announcementReads'), where('userId', '==', firebaseUser.uid))
        );
        const rSet = new Set<string>(
          readSnap.docs.map((d) => String(d.data().announcementId || ''))
        );

        if (!cancelled) {
          setItems(filtered.slice(0, 10));
          setReadIds(rSet);
        }
      } catch {
        // ignore if not permitted
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, role, studentProfile]);

  const markRead = async (announcementId: string) => {
    if (!firebaseUser) return;
    const readDocId = `${announcementId}_${firebaseUser.uid}`;
    try {
      await setDoc(doc(db, 'announcementReads', readDocId), {
        announcementId,
        userId: firebaseUser.uid,
        readAt: serverTimestamp(),
      });
      setReadIds((prev) => new Set(prev).add(announcementId));
    } catch {
      // ignore
    }
  };

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Internal notifications"
        className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-700 text-white text-[10px] font-mono tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-sm z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Internal Notices</span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {unreadCount} unread
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-5 text-sm text-slate-500 text-center">
                No internal announcements yet.
              </div>
            ) : (
              items.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 ${isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 leading-snug">
                        {item.title}
                      </p>
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => void markRead(item.id)}
                          title="Mark as read"
                          className="text-xs text-blue-700 hover:underline shrink-0 inline-flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.body}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {item.category} · {item.priority}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          {onOpenAll && (
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenAll();
                }}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                Open Announcement Center
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
