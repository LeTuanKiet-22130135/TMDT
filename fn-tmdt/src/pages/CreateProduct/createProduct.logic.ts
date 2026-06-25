export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  categoryId: string;
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

export const CATEGORIES: SelectOption[] = [
  { id: 'illustration', label: 'Tranh minh họa' },
  { id: 'live2d', label: 'Live2D Model' },
  { id: 'concept-art', label: 'Concept Art' },
  { id: 'wallpaper', label: 'Wallpaper' },
  { id: 'sticker', label: 'Sticker Pack' },
  { id: 'chibi', label: 'Chibi / Fanart' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'emote', label: 'Emote' },
];

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
  categoryId: '',
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
  if (!data.categoryId) errors.categoryId = 'Vui lòng chọn danh mục';
  if (data.previewImages.length === 0) errors.previewImages = 'Cần ít nhất 1 ảnh xem trước';
  return errors;
};
