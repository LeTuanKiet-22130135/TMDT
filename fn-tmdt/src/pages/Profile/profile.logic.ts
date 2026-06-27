import { useState, useRef, useCallback, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserProfileContext';

export interface ProfileDraft {
  displayName: string;
  bio: string;
  specialties: string[];
  socialLinks: { website: string; twitter: string; instagram: string };
  avatarPreview: string;
  bannerPreview: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('access_token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/v1/uploads/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const json = await res.json();
  return `${API_BASE}${json.url}`;
}

export const useProfileEditor = () => {
  const { profile, loading, updateProfile } = useUserProfile();

  const [draft, setDraft] = useState<ProfileDraft>({
    displayName: profile.displayName,
    bio: profile.bio,
    specialties: [...profile.specialties],
    socialLinks: { ...profile.socialLinks },
    avatarPreview: profile.avatar,
    bannerPreview: profile.banner,
  });

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!loading && profile.id && !initialized) {
      setDraft({
        displayName: profile.displayName,
        bio: profile.bio,
        specialties: [...profile.specialties],
        socialLinks: { ...profile.socialLinks },
        avatarPreview: profile.avatar,
        bannerPreview: profile.banner,
      });
      setInitialized(true);
    }
  }, [loading, profile.id, initialized]);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraft, string>>>({});

  const avatarFileRef = useRef<File | null>(null);
  const bannerFileRef = useRef<File | null>(null);

  const handleAvatarChange = useCallback((file: File) => {
    avatarFileRef.current = file;
    setDraft((d) => ({ ...d, avatarPreview: URL.createObjectURL(file) }));
  }, []);

  const handleBannerChange = useCallback((file: File) => {
    bannerFileRef.current = file;
    setDraft((d) => ({ ...d, bannerPreview: URL.createObjectURL(file) }));
  }, []);

  const removeBanner = useCallback(() => {
    bannerFileRef.current = null;
    setDraft((d) => ({ ...d, bannerPreview: null }));
  }, []);

  const validate = (d: ProfileDraft): boolean => {
    const errs: typeof errors = {};
    if (!d.displayName.trim()) errs.displayName = 'Tên hiển thị không được để trống';
    if (d.displayName.length > 50) errs.displayName = 'Tối đa 50 ký tự';
    if (d.bio.length > 500) errs.bio = 'Tối đa 500 ký tự';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate(draft)) return;
    setIsSaving(true);
    try {
      const avatarUrl = avatarFileRef.current
        ? await uploadImage(avatarFileRef.current)
        : undefined;
      const bannerUrl = bannerFileRef.current
        ? await uploadImage(bannerFileRef.current)
        : draft.bannerPreview === null
          ? ''  // empty string signals "remove banner"
          : undefined;

      await updateProfile({
        fullName: draft.displayName,
        bio: draft.bio,
        specialties: draft.specialties,
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        website: draft.socialLinks.website,
        twitter: draft.socialLinks.twitter,
        instagram: draft.socialLinks.instagram,
      });

      avatarFileRef.current = null;
      bannerFileRef.current = null;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [draft, updateProfile]);

  return {
    draft,
    setDraft,
    isSaving,
    saved,
    errors,
    profile,
    loading,
    handleAvatarChange,
    handleBannerChange,
    removeBanner,
    handleSubmit,
  };
};
