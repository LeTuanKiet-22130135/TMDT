import React, { createContext, useContext, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ME_QUERY, UPDATE_PROFILE_MUTATION } from '../graphql/profile';

export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  shortlink: string;
  isGold: boolean;
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
  isVerified: boolean;
  rewardPoints: number;
}

interface UserProfileContextValue {
  profile: UserProfile;
  loading: boolean;
  updateProfile: (updates: Partial<UpdateProfileInput>) => Promise<void>;
  notifyLogin: () => void;
}

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  specialties?: string[];
  website?: string;
  twitter?: string;
  instagram?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  displayName: 'Người Dùng',
  handle: 'user',
  shortlink: '',
  isGold: false,
  email: 'user@example.com',
  avatar: 'https://ui-avatars.com/api/?name=User&background=ffafb1&color=db2e50',
  banner: null,
  bio: '',
  specialties: [],
  socialLinks: { website: '', twitter: '', instagram: '' },
  isVerified: false,
  rewardPoints: 0,
};

function meDataToProfile(me: Record<string, unknown>): UserProfile {
  const social = (me.socialLinks as Record<string, string>) ?? {};
  return {
    id: String(me.id ?? ''),
    displayName: String(me.fullName ?? 'Người Dùng'),
    handle: String(me.username ?? 'user'),
    shortlink: String(me.shortlink ?? ''),
    isGold: Boolean(me.isGold),
    email: String(me.email ?? ''),
    avatar:
      (me.avatarUrl as string) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(String(me.fullName ?? 'User'))}&background=ffafb1&color=db2e50`,
    banner: (me.bannerUrl as string) || null,
    bio: String(me.bio ?? ''),
    specialties: Array.isArray(me.specialties) ? (me.specialties as string[]) : [],
    socialLinks: {
      website: social.website ?? '',
      twitter: social.twitter ?? '',
      instagram: social.instagram ?? '',
    },
    isVerified: Boolean(me.isVerified),
    rewardPoints: Number(me.rewardPoints ?? 0),
  };
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));

  const { data, loading, refetch } = useQuery(ME_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const [mutate] = useMutation(UPDATE_PROFILE_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  const profile = useMemo<UserProfile>(() => {
    const me = (data as { me?: Record<string, unknown> } | undefined)?.me;
    if (me) return meDataToProfile(me);
    return DEFAULT_PROFILE;
  }, [data]);

  const updateProfile = async (updates: Partial<UpdateProfileInput>) => {
    await mutate({ variables: updates });
  };

  const notifyLogin = () => {
    setIsAuthenticated(true);
    refetch();
  };

  return (
    <UserProfileContext.Provider value={{ profile, loading, updateProfile, notifyLogin }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
};
