import { useHomeData } from '../Home/home.logic';

export interface AuthorProfile {
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  followers: string;
  memberSince: string;
  specialties: string[];
  totalSales: number;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

const authorProfiles: Record<string, AuthorProfile> = {
  blueneko: {
    handle: 'blueneko',
    name: 'blueneko',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJcjaFmuI06E2-7RyXXIWRgu0pKEvl_fyyWOEeyR8mli5DQG8Uws5CnhZwAKSicULujuUboDm2JjWQYcysyRZ5VOXloklP7R4Z9M9AqDhWfrefpdnufffJ3l2lYlRZ20JxHnagMBBgbfrcfAGR2nbwsRd2VJ3O5arbx4KcTx_6wHfglqmwEeCHF_lVvjjIZs-gxmSIDTq7nXchKPLOedlmYrH9T-HEoTVSuS50ZJVYy7YHbFpijGN24pFDx_8uqWhpVNzAGY1BFjrk',
    bio: 'Nhà thiết kế trang phục 3D chuyên về phong cách truyền thống Nhật Bản. Tôi tạo ra các mẫu trang phục dành cho VTuber và nhân vật trong game với chất lượng studio.',
    followers: '3.6k',
    memberSince: 'Tháng 3, 2022',
    specialties: ['Trang phục 3D', 'VTuber', 'Phong cách Nhật'],
    totalSales: 412,
    socialLinks: {
      twitter: 'https://twitter.com/blueneko',
      website: 'https://blueneko.art',
    },
  },
  elenav: {
    handle: 'elenav',
    name: 'Elena V.',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz',
    bio: 'Nghệ sĩ Live2D và background chuyên nghiệp. Tôi thiết kế các mẫu nhân vật anime và hình nền nghệ thuật chất lượng cao cho streaming và game.',
    followers: '2.1k',
    memberSince: 'Tháng 7, 2021',
    specialties: ['Live2D', 'VTuber Model', 'Background Art'],
    totalSales: 287,
    socialLinks: {
      twitter: 'https://twitter.com/elenav',
      instagram: 'https://instagram.com/elenav.art',
    },
  },
  studioarid: {
    handle: 'studioarid',
    name: 'Studio Arid',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtluSThhnYoePmLDCRSU_GSBw_VfMQOONhTs6eucDvi1uYfU4rza65Lv6DBt6uciYczZ_bd5vRt2l6I24Q7fwuYsCKfmcLlvVF2KV1VhuJefl8tRYscgLUqaMUsxLIoQLrUigKjfzEk_jMC6wMh9Y_Mgb-drl2_Liexezmv9Yn2VGaM39HcuzwTEFej7TkDTsJtso_iN_a2bxozXFhwrev1ozNole7eA-wFH4Zf9398W91JQ0AMxWkUednwnLrNNUE9KbtqIzSlgMg',
    bio: 'Studio thiết kế chuyên sản xuất texture pack và trang phục Gothic cao cấp. Với hơn 5 năm kinh nghiệm, chúng tôi cung cấp nội dung chất lượng cho cộng đồng VTuber toàn cầu.',
    followers: '12.5k',
    memberSince: 'Tháng 1, 2020',
    specialties: ['Texture Pack', 'Gothic Style', 'Studio Quality'],
    totalSales: 1840,
    socialLinks: {
      twitter: 'https://twitter.com/studioarid',
      instagram: 'https://instagram.com/studioarid',
      website: 'https://studioarid.com',
    },
  },
};

export const useAuthorData = (handle: string) => {
  const { assets } = useHomeData();
  const profile = authorProfiles[handle] ?? null;
  const authorAssets = assets.filter(
    (a) => a.authorHandle.replace('@', '') === handle,
  );
  const avgRating =
    authorAssets.length > 0
      ? authorAssets.reduce((sum, a) => sum + a.rating, 0) / authorAssets.length
      : 0;
  const totalReviews = authorAssets.reduce((sum, a) => sum + a.reviewsCount, 0);
  const bannerImage = authorAssets[0]?.imageUrl ?? null;

  return { profile, authorAssets, avgRating, totalReviews, bannerImage };
};
