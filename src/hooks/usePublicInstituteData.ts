import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_BATCHES,
  DEFAULT_COURSES,
  DEFAULT_GALLERY_MEDIA,
  DEFAULT_PUBLIC_FACULTY,
  DEFAULT_PUBLIC_NOTICES,
  DEFAULT_WEBSITE_CONTENT,
  DEFAULT_WEBSITE_SETTINGS,
} from '../data/verifiedDefaults';
import { fetchPublicWebsiteBundle } from '../services/firestoreService';
import type {
  Batch,
  Course,
  GalleryMedia,
  PublicFaculty,
  PublicNotice,
  WebsiteContent,
  WebsiteSettings,
} from '../types/models';

export interface PublicInstituteState {
  settings: WebsiteSettings;
  content: Record<string, WebsiteContent>;
  courses: Course[];
  batches: Batch[];
  faculty: PublicFaculty[];
  notices: PublicNotice[];
  gallery: GalleryMedia[];
  loading: boolean;
  isSeeded: boolean;
  refresh: () => Promise<void>;
}

export function usePublicInstituteData(): PublicInstituteState {
  const [state, setState] = useState({
    settings: DEFAULT_WEBSITE_SETTINGS,
    content: DEFAULT_WEBSITE_CONTENT,
    courses: DEFAULT_COURSES,
    batches: DEFAULT_BATCHES,
    faculty: DEFAULT_PUBLIC_FACULTY,
    notices: DEFAULT_PUBLIC_NOTICES,
    gallery: DEFAULT_GALLERY_MEDIA,
    loading: true,
    isSeeded: false,
  });

  const refresh = useCallback(async () => {
    try {
      const bundle = await fetchPublicWebsiteBundle();
      setState({
        ...bundle,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
