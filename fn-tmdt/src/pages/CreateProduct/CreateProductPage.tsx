import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Layers, AlignLeft, Tag, Wrench, FileType,
  BadgeDollarSign, Scale, Eye, ChevronDown, Check, Send,
  Save, CheckCircle2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { FileUploadZone } from './components/FileUploadZone';
import { PreviewImagesUpload } from './components/PreviewImagesUpload';
import { TagInput } from './components/TagInput';
import {
  initialFormData, validateForm, formatPrice,
  LICENSES, SOFTWARES, FILE_FORMATS,
  useCreateProduct,
  type ProductFormData, type SelectOption,
} from './createProduct.logic';

/* ── Reusable section wrapper ── */
const Section: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }> = ({
  icon, title, subtitle, children,
}) => (
  <div className="bg-white rounded-2xl border border-[#FFC9D2]/30 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#FFC9D2]/20">
      <span className="w-8 h-8 rounded-lg bg-[#FFC9D2]/30 flex items-center justify-center text-[#F65C88]">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-[#040316]">{title}</p>
        {subtitle && <p className="text-xs text-[#040316]/50">{subtitle}</p>}
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

/* ── Field label ── */
const Label: React.FC<{ text: string; required?: boolean; hint?: string }> = ({ text, required, hint }) => (
  <label className="block mb-1.5">
    <span className="text-sm font-semibold text-[#040316]">{text}</span>
    {required && <span className="text-[#F65C88] ml-0.5">*</span>}
    {hint && <span className="ml-2 text-xs text-[#040316]/40 font-normal">{hint}</span>}
  </label>
);

/* ── Chip toggle ── */
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

/* ── Native select wrapper ── */
const SelectField: React.FC<{
  value: string; onChange: (v: string) => void;
  options: SelectOption[]; placeholder: string; error?: string;
}> = ({ value, onChange, options, placeholder, error }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border text-sm bg-white text-[#040316] outline-none transition-all cursor-pointer ${
        error
          ? 'border-red-300 focus:ring-2 focus:ring-red-200'
          : 'border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40'
      }`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#040316]/40 pointer-events-none" />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

/* ════════════════════════════════════════ */

export const CreateProductPage: React.FC = () => {
  const { submitProduct, loading: submitting } = useCreateProduct();

  const [form, setForm] = useState<ProductFormData>(initialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleChip = (key: 'softwareIds' | 'formatIds', id: string) => {
    const current = form[key];
    set(key, current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
  };

  const handleSubmit = async (draft: boolean) => {
    if (!draft) {
      const errs = validateForm(form);
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setErrors({});
    setSubmitError(null);
    setIsDraft(draft);
    try {
      const id = await submitProduct(form);
      setSuccessId(id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const charCount = form.title.length;

  if (successId) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-[#040316] mb-2">Đăng sản phẩm thành công!</h2>
          <p className="text-sm text-[#040316]/50 mb-2">
            AI đang phân tích và gắn nhãn ảnh. Sản phẩm sẽ tự động hiển thị trong cửa hàng sau khi quá trình này hoàn tất (thường dưới 1 phút).
          </p>
          <p className="text-xs text-[#040316]/30 mb-6">ID: {successId}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-5 py-2 rounded-full text-sm font-semibold border border-[#FFC9D2] text-[#040316]/70 hover:bg-[#FFC9D2]/10 transition-colors">
              Về trang chủ
            </Link>
            <button
              onClick={() => { setSuccessId(null); setForm(initialFormData()); }}
              className="px-5 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50]"
            >
              Đăng thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFE]">
      <Header />

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#040316]/50 hover:text-[#F65C88] transition-colors">
            <ArrowLeft size={15} />
            Quay lại
          </Link>
          <span className="text-[#040316]/30">/</span>
          <span className="text-sm font-semibold text-[#040316]">Đăng sản phẩm mới</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Basic info */}
            <Section icon={<AlignLeft size={16} />} title="Thông tin cơ bản">
              <div className="flex flex-col gap-4">
                <div>
                  <Label text="Tiêu đề" required />
                  <div className="relative">
                    <input
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      maxLength={120}
                      placeholder="Tên sản phẩm của bạn..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#040316] bg-white outline-none transition-all ${
                        errors.title
                          ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                          : 'border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40'
                      }`}
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${charCount > 100 ? 'text-orange-400' : 'text-[#040316]/30'}`}>
                      {charCount}/120
                    </span>
                  </div>
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <Label text="Mô tả" required hint="Hỗ trợ markdown cơ bản" />
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={5}
                    placeholder="Mô tả chi tiết về sản phẩm: phong cách, nội dung, cách sử dụng..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#040316] bg-white outline-none resize-none transition-all ${
                      errors.description
                        ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                        : 'border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40'
                    }`}
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>
              </div>
            </Section>

            {/* File upload */}
            <Section
              icon={<Layers size={16} />}
              title="File sản phẩm"
              subtitle="File khách hàng sẽ tải về sau khi mua"
            >
              <FileUploadZone
                file={form.mainFile}
                onChange={(f) => set('mainFile', f)}
                error={errors.mainFile}
              />
            </Section>

            {/* Preview images */}
            <Section
              icon={<Eye size={16} />}
              title="Ảnh xem trước"
              subtitle={`Tối đa ${20} ảnh · Ảnh đầu tiên là ảnh bìa hiển thị`}
            >
              <PreviewImagesUpload
                images={form.previewImages}
                onChange={(imgs) => set('previewImages', imgs)}
                error={errors.previewImages}
              />
            </Section>

            {/* Tags */}
            <Section icon={<Tag size={16} />} title="Tags" subtitle="Tối đa 15 tags · nhấn Enter hoặc dấu phẩy để thêm">
              <TagInput
                tags={form.tags}
                onChange={(tags) => set('tags', tags)}
              />
              {form.tags.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['live2d', 'illustration', 'anime', 'vtuber', 'fanart'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('tags', [...form.tags, s])}
                      className="text-xs px-2.5 py-1 rounded-full border border-dashed border-[#FFC9D2] text-[#040316]/40 hover:text-[#F65C88] hover:border-[#F65C88]/60 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {/* Software & formats */}
            <Section icon={<Wrench size={16} />} title="Phần mềm & Định dạng" subtitle="Tuỳ chọn — giúp người mua biết họ cần gì">
              <div className="flex flex-col gap-4">
                <div>
                  <Label text="Phần mềm sử dụng" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SOFTWARES.map((s) => (
                      <Chip
                        key={s.id}
                        label={s.label}
                        selected={form.softwareIds.includes(s.id)}
                        onClick={() => toggleChip('softwareIds', s.id)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label text="Định dạng file bao gồm" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {FILE_FORMATS.map((f) => (
                      <Chip
                        key={f.id}
                        label={f.label}
                        selected={form.formatIds.includes(f.id)}
                        onClick={() => toggleChip('formatIds', f.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">

            {/* Pricing */}
            <Section icon={<BadgeDollarSign size={16} />} title="Giá bán">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => set('isFree', !form.isFree)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                    form.isFree
                      ? 'bg-[#FFC9D2]/20 border-[#F65C88]/50 text-[#F65C88]'
                      : 'border-[#FFC9D2]/50 text-[#040316]/60 hover:border-[#F65C88]/40'
                  }`}
                >
                  <span className="text-sm font-medium">Miễn phí</span>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${form.isFree ? 'bg-[#F65C88]' : 'bg-[#040316]/20'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {!form.isFree && (
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#040316]/50 font-medium">₫</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={form.price || ''}
                        onChange={(e) => set('price', Number(e.target.value))}
                        placeholder="0"
                        className={`w-full pl-7 pr-4 py-2.5 rounded-xl border text-sm text-[#040316] bg-white outline-none transition-all ${
                          errors.price
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                            : 'border-[#FFC9D2]/60 focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40'
                        }`}
                      />
                    </div>
                    {form.price > 0 && (
                      <p className="mt-1 text-xs text-[#040316]/50 text-right">
                        {formatPrice(form.price)} VND
                      </p>
                    )}
                    {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                  </div>
                )}
              </div>
            </Section>

            {/* License */}
            <Section icon={<Layers size={16} />} title="Giấy phép">
              <div className="flex flex-col gap-3">
                <div>
                  <Label text="Giấy phép sử dụng" required />
                  <SelectField
                    value={form.licenseId}
                    onChange={(v) => set('licenseId', v)}
                    options={LICENSES}
                    placeholder="Chọn giấy phép..."
                  />
                </div>

                {/* License explainer */}
                {form.licenseId && (
                  <div className="flex gap-2 p-3 rounded-xl bg-[#FFC9D2]/10 border border-[#FFC9D2]/30">
                    <Scale size={14} className="text-[#F65C88] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#040316]/60 leading-relaxed">
                      {form.licenseId === 'personal' && 'Chỉ dùng cho mục đích cá nhân, không thương mại.'}
                      {form.licenseId === 'commercial' && 'Cho phép sử dụng thương mại có giới hạn.'}
                      {form.licenseId === 'extended' && 'Cho phép sử dụng thương mại đầy đủ, bao gồm bán lại.'}
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* Format info */}
            {(form.formatIds.length > 0 || form.softwareIds.length > 0) && (
              <div className="px-4 py-3 rounded-xl bg-[#FBFBFE] border border-[#FFC9D2]/30">
                <p className="text-xs font-semibold text-[#040316]/60 mb-2 uppercase tracking-wide">Tổng quan</p>
                {form.formatIds.length > 0 && (
                  <div className="flex items-start gap-2 mb-1.5">
                    <FileType size={12} className="text-[#F65C88] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#040316]/60">{form.formatIds.join(', ').toUpperCase()}</p>
                  </div>
                )}
                {form.softwareIds.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Wrench size={12} className="text-[#F65C88] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#040316]/60">
                      {form.softwareIds.map((id) => SOFTWARES.find((s) => s.id === id)?.label).filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {/* Publish actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && !isDraft ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Đăng sản phẩm
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#040316]/70 border border-[#FFC9D2]/60 bg-white hover:bg-[#FFC9D2]/10 hover:border-[#F65C88]/40 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && isDraft ? (
                  <span className="w-4 h-4 border-2 border-[#040316]/20 border-t-[#040316]/60 rounded-full animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Lưu nháp
              </button>
            </div>

            <p className="text-center text-xs text-[#040316]/30">
              Bằng cách đăng sản phẩm, bạn đồng ý với{' '}
              <span className="text-[#F65C88] cursor-pointer hover:underline">điều khoản sử dụng</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;
