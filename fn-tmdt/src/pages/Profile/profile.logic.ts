import { useState, useRef, useCallback } from 'react';
import { useUserProfile } from '../../contexts/UserProfileContext';

export interface ProfileDraft {
  displayName: string;
  bio: string;
  specialties: string[];
  socialLinks: { website: string; twitter: string; instagram: string };
  avatarPreview: string;
  bannerPreview: string | null;
}

export const useProfileEditor = () => {
  const { profile, updateProfile } = useUserProfile();

  const [draft, setDraft] = useState<ProfileDraft>({
    displayName: profile.displayName,
    bio: profile.bio,
    specialties: [...profile.specialties],
    socialLinks: { ...profile.socialLinks },
    avatarPreview: profile.avatar,
    bannerPreview: profile.banner,
  });

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
      // TODO: when backend ready, upload files first then call mutation:
      // const avatarUrl = avatarFileRef.current
      //   ? await uploadFile('/api/v1/uploads', avatarFileRef.current)
      //   : profile.avatar;
      // const bannerUrl = bannerFileRef.current
      //   ? await uploadFile('/api/v1/uploads', bannerFileRef.current)
      //   : profile.banner;
      // await apolloClient.mutate({
      //   mutation: UPDATE_PROFILE,
      //   variables: { input: { displayName: draft.displayName, bio: draft.bio,
      //     specialties: draft.specialties, socialLinks: draft.socialLinks,
      //     avatar: avatarUrl, banner: bannerUrl } },
      // });

      await new Promise((r) => setTimeout(r, 600)); // prototype delay

      updateProfile({
        displayName: draft.displayName,
        bio: draft.bio,
        specialties: draft.specialties,
        socialLinks: draft.socialLinks,
        avatar: draft.avatarPreview,
        banner: draft.bannerPreview,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
    handleAvatarChange,
    handleBannerChange,
    removeBanner,
    handleSubmit,
  };
};
