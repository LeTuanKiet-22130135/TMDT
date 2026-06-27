import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, AlignLeft, Tag, Wrench,
  BadgeDollarSign, Scale, Check, ChevronDown,
  CheckCircle2, Loader2, X, Plus,
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { client } from '../../apollo';
import { PRODUCT_DETAIL_QUERY, UPDATE_PRODUCT_MUTATION } from '../../graphql/product';
import { Header } from '../../components/layout/Header';
import { TagInput } from '../CreateProduct/components/TagInput';
import { resolveMediaUrl } from '../../lib/media';
import { useUserProfile } from '../../contexts/UserProfileContext';
import {
  LICENSES, SOFTWARES, FILE_FORMATS,
  ACCEPTED_PREVIEW_TYPES,
  type SelectOption,
} from '../CreateProduct/createProduct.logic';

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
  if (!res.ok) throw new Error('Tải ảnh thất bại');
  const json = await res.json();
  return `${API_BASE}${json.url}`;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-[#FFC9D2]/30 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#FFC9D2]/20">
      <span className="w-8 h-8 rounded-lg bg-[#FFC9D2]/30 flex items-center justify-center text-[#F65C88]">{icon}</span>
      <p className="text-sm font-bold text-[#040316]">{title}</p>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Chip: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      selected
        ? 'bg-[#FFC9D2]/40 border-[#F65C88]/60 text-[#F65C88]'
        : 'bg-white border-[#FFC9D2]/50 text-[#040316]/60 hover:border-[#F65C88]/40'
    }`}
  >
    {selected && <Check size={11} strokeWidth={2.5} />}
    {label}
  </button>
);

const SelectField: React.FC<{
  value: string; onChange: (v: string) => void;
  options: SelectOption[]; placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border text-sm bg-white text-[#040316] outline-none transition-all cursor-pointer border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#040316]/40 pointer-events-none" />
  </div>
);

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const { data, loading: loadingProduct } = useQuery<{ product: any }>(
    PRODUCT_DETAIL_QUERY,
    { client, variables: { productId: id }, skip: !id, fetchPolicy: 'network-only' }
  );
  const product = data?.product;

  const [updateProduct, { loading: saving }] = useMutation(UPDATE_PRODUCT_MUTATION, { client });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [licenseId, setLicenseId] = useState('personal');
  const [tags, setTags] = useState<string[]>([]);
  const [softwareIds, setSoftwareIds] = useState<string[]>([]);
  const [formatIds, setFormatIds] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name ?? '');
    setDescription(product.description ?? '');
    setPrice(product.price ?? 0);
    setIsFree((product.price ?? 0) === 0);
    setLicenseId(product.licenseType ?? 'personal');
    setTags([...(product.userTags ?? []), ...(product.aiTags ?? [])]);
    setSoftwareIds(product.softwareTags ?? []);
    setFormatIds(product.formatTags ?? []);
    setImageUrls(product.imageUrls ?? []);
  }, [product]);

  const isOwner = !!profile.id && product && profile.id === product.store.owner.id;

  const toggleChip = (
    arr: string[], setArr: (v: string[]) => void, id: string
  ) => setArr(arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]);

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setImageUrls((prev) => [...prev, ...urls]);
    } catch {
      setSaveError('Tải ảnh thất bại');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) =>
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!id) return;
    setSaveError(null);
    try {
      await updateProduct({
        variables: {
          productId: id,
          name,
          description,
          price: isFree ? 0 : price,
          imageUrls,
          userTags: tags,
          licenseType: licenseId,
          softwareTags: softwareIds,
          formatTags: formatIds,
        },
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FBFBFE]">
        <Loader2 size={32} className="animate-spin text-[#F65C88]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FBFBFE] text-on-surface">
        <p>Không tìm thấy sản phẩm. <Link to="/" className="text-[#F65C88] hover:underline">Về trang chủ</Link></p>
      </div>
    );
  }

  if (profile.id && !isOwner) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FBFBFE] text-on-surface">
        <p>Bạn không có quyền chỉnh sửa sản phẩm này.</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-[#040316] mb-2">Cập nhật thành công!</h2>
          <div className="flex gap-3 justify-center mt-6">
            <Link
              to={`/asset/${id}`}
              className="px-5 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50]"
            >
              Xem sản phẩm
            </Link>
            <button
              onClick={() => setSaved(false)}
              className="px-5 py-2 rounded-full text-sm font-semibold border border-[#FFC9D2] text-[#040316]/70 hover:bg-[#FFC9D2]/10"
            >
              Tiếp tục chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFE]">
      <Header />
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(`/asset/${id}`)}
            className="flex items-center gap-1.5 text-sm text-[#040316]/50 hover:text-[#F65C88] transition-colors"
          >
            <ArrowLeft size={15} />
            Quay lại sản phẩm
          </button>
          <span className="text-[#040316]/30">/</span>
          <span className="text-sm font-semibold text-[#040316]">Chỉnh sửa</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="flex flex-col gap-5">

            <Section icon={<AlignLeft size={16} />} title="Thông tin cơ bản">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-[#040316]">Tiêu đề <span className="text-[#F65C88]">*</span></label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40 text-sm text-[#040316] bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-[#040316]">Mô tả <span className="text-[#F65C88]">*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40 text-sm text-[#040316] bg-white outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </Section>

            {/* Preview images */}
            <Section icon={<AlignLeft size={16} />} title="Ảnh xem trước">
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#FFC9D2]/40 group">
                    <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-[#F65C88] text-white px-1.5 py-0.5 rounded-full font-bold">Bìa</span>
                    )}
                  </div>
                ))}
                <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-[#FFC9D2] flex flex-col items-center justify-center cursor-pointer hover:border-[#F65C88]/60 transition-colors ${uploadingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingImages ? <Loader2 size={20} className="animate-spin text-[#F65C88]" /> : <Plus size={20} className="text-[#F65C88]/60" />}
                  <span className="text-[10px] text-[#040316]/40 mt-1">Thêm ảnh</span>
                  <input type="file" accept={ACCEPTED_PREVIEW_TYPES} multiple className="hidden" onChange={handleImageAdd} />
                </label>
              </div>
            </Section>

            <Section icon={<Tag size={16} />} title="Tags">
              <TagInput tags={tags} onChange={setTags} />
            </Section>

            <Section icon={<Wrench size={16} />} title="Phần mềm & Định dạng">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#040316] mb-2">Phần mềm sử dụng</p>
                  <div className="flex flex-wrap gap-2">
                    {SOFTWARES.map((s) => (
                      <Chip key={s.id} label={s.label} selected={softwareIds.includes(s.id)} onClick={() => toggleChip(softwareIds, setSoftwareIds, s.id)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#040316] mb-2">Định dạng file</p>
                  <div className="flex flex-wrap gap-2">
                    {FILE_FORMATS.map((f) => (
                      <Chip key={f.id} label={f.label} selected={formatIds.includes(f.id)} onClick={() => toggleChip(formatIds, setFormatIds, f.id)} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            <Section icon={<BadgeDollarSign size={16} />} title="Giá bán">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsFree(!isFree)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                    isFree
                      ? 'bg-[#FFC9D2]/20 border-[#F65C88]/50 text-[#F65C88]'
                      : 'border-[#FFC9D2]/50 text-[#040316]/60 hover:border-[#F65C88]/40'
                  }`}
                >
                  <span className="text-sm font-medium">Miễn phí</span>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${isFree ? 'bg-[#F65C88]' : 'bg-[#040316]/20'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>
                {!isFree && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#040316]/50 font-medium">₫</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40 text-sm text-[#040316] bg-white outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </Section>

            <Section icon={<Scale size={16} />} title="Giấy phép">
              <SelectField value={licenseId} onChange={setLicenseId} options={LICENSES} placeholder="Chọn giấy phép..." />
            </Section>

            {saveError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {saveError}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !description.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;
