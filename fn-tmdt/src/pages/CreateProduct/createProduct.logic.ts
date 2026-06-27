import { useQuery, useMutation } from '@apollo/client/react';
import { CATEGORIES_QUERY, CREATE_PRODUCT_MUTATION } from '../../graphql/product';

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  licenseId: string;
  tags: string[];
  softwareIds: string[];
  formatIds: string[];
  mainFile: File | null;
  previewImages: PreviewImage[];
}

export interface PreviewImage {
  id: string;
  file: File;
  url: string;
}

export interface SelectOption {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const LICENSES: SelectOption[] = [
  { id: 'personal', label: 'Cá nhân (Personal Use)' },
  { id: 'commercial', label: 'Thương mại (Commercial)' },
  { id: 'extended', label: 'Thương mại mở rộng (Extended)' },
];

export const SOFTWARES: SelectOption[] = [
  { id: 'photoshop', label: 'Photoshop' },
  { id: 'clip-studio', label: 'Clip Studio Paint' },
  { id: 'procreate', label: 'Procreate' },
  { id: 'illustrator', label: 'Illustrator' },
  { id: 'live2d-cubism', label: 'Live2D Cubism' },
  { id: 'blender', label: 'Blender' },
];

export const FILE_FORMATS: SelectOption[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'psd', label: 'PSD' },
  { id: 'ai', label: 'AI' },
  { id: 'svg', label: 'SVG' },
  { id: 'moc3', label: '.moc3 (Live2D)' },
  { id: 'cmo3', label: '.cmo3 (Live2D)' },
  { id: 'zip', label: 'ZIP' },
  { id: 'mp4', label: 'MP4' },
];

export const MAX_PREVIEW_IMAGES = 20;

export const ACCEPTED_ASSET_TYPES =
  '.png,.jpg,.jpeg,.psd,.ai,.svg,.zip,.mp4,.gif,.moc3,.cmo3,.can3,.vtube3,.moc,.physics3.json';

export const ACCEPTED_PREVIEW_TYPES = 'image/png,image/jpeg,image/gif,image/webp';

export const initialFormData = (): ProductFormData => ({
  title: '',
  description: '',
  price: 0,
  isFree: false,
  licenseId: 'personal',
  tags: [],
  softwareIds: [],
  formatIds: [],
  mainFile: null,
  previewImages: [],
});

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat('vi-VN').format(value);

export const validateForm = (data: ProductFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.title.trim()) errors.title = 'Vui lòng nhập tiêu đề';
  if (data.title.length > 120) errors.title = 'Tiêu đề tối đa 120 ký tự';
  if (!data.description.trim()) errors.description = 'Vui lòng nhập mô tả';
  if (!data.mainFile) errors.mainFile = 'Vui lòng tải lên file sản phẩm';
  if (!data.isFree && data.price <= 0) errors.price = 'Vui lòng nhập giá bán';
  if (data.previewImages.length === 0) errors.previewImages = 'Cần ít nhất 1 ảnh xem trước';
  return errors;
};

// ── Upload helpers ────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '';

async function uploadSingleFile(file: File, endpoint: 'image' | 'file'): Promise<string> {
  const token = localStorage.getItem('access_token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/v1/uploads/${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const msg = detail?.detail || detail?.message || res.statusText || 'Lỗi không xác định';
    throw new Error(`Tải file thất bại: ${msg}`);
  }
  const json = await res.json();
  return `${API_BASE}${json.url}`;
}

// ── useCategories hook ────────────────────────────────────────────

export const useCategories = () => {
  const { data, loading } = useQuery(CATEGORIES_QUERY);
  const categories: Category[] = (data as { categories?: Category[] } | undefined)?.categories ?? [];
  return { categories, loading };
};

// ── useCreateProduct hook ─────────────────────────────────────────

export const useCreateProduct = () => {
  const [mutate, { loading: mutating }] = useMutation(CREATE_PRODUCT_MUTATION);

  const submitProduct = async (form: ProductFormData): Promise<string> => {
    // 1. Upload main asset file
    const mainFileUrl = form.mainFile
      ? await uploadSingleFile(form.mainFile, 'file')
      : null;

    // 2. Upload preview images concurrently
    const imageUrls = await Promise.all(
      form.previewImages.map((pi) => uploadSingleFile(pi.file, 'image')),
    );

    // 3. GraphQL mutation
    const { data } = await mutate({
      variables: {
        name: form.title,
        description: form.description,
        price: form.isFree ? 0 : form.price,
        imageUrls,
        mainFileUrl,
        userTags: form.tags,
        licenseType: form.licenseId,
        softwareTags: form.softwareIds,
        formatTags: form.formatIds,
        stockQuantity: 999,
      },
    });

    const product = (data as { createProduct?: { id: string } } | undefined)?.createProduct;
    if (!product) throw new Error('Tạo sản phẩm thất bại');
    return product.id;
  };

  return { submitProduct, loading: mutating };
};
