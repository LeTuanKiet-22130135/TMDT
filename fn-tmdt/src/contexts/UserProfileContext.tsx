import React, { createContext, useContext, useState, useCallback } from 'react';

export interface UserProfile {
  displayName: string;
  handle: string;
  email: string;
  avatar: string;
  banner: string | null;
  bio: string;
  specialties: string[];
  socialLinks: {
    website: string;
    twitter: string;
    instagram: string;
  };
}

interface UserProfileContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const STORAGE_KEY = 'lumine_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Người Dùng',
  handle: 'user',
  email: 'user@example.com',
  avatar: 'https://ui-avatars.com/api/?name=User&background=ffafb1&color=db2e50',
  banner: null,
  bio: '',
  specialties: [],
  socialLinks: { website: '', twitter: '', instagram: '' },
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_PROFILE;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      // TODO: replace with GraphQL mutation updateProfile(input: ProfileUpdateInput)
      // await apolloClient.mutate({ mutation: UPDATE_PROFILE, variables: { input: updates } });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
};
