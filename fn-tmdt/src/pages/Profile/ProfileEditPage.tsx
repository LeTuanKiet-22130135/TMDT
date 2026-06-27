import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, X, Globe, Link2, ArrowLeft,
  CheckCircle2, Loader2, Save, Lock, RefreshCw,
} from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';
import { TagInput } from '../CreateProduct/components/TagInput';
import { useProfileEditor } from './profile.logic';
import { CropModal } from './components/CropModal';
import { UPDATE_SHORTLINK_MUTATION } from '../../graphql/profile';

const ACCEPT_IMG = 'image/jpeg,image/png,image/webp,image/gif';
const AVATAR_ASPECT = 1;
const BANNER_ASPECT = 3;

interface CropTarget {
  src: string;
  type: 'avatar' | 'banner';
  aspect: number;
  shape: 'rect' | 'round';
  title: string;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-3">
    {children}
  </p>
);

const FieldWrapper: React.FC<{ label: string; error?: string; hint?: string; children: React.ReactNode }> = ({
  label, error, hint, children,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-on-surface">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-on-surface-variant/60">{hint}</p>}
    {error && <p className="text-xs text-[#DB2E50]">{error}</p>}
  </div>
);

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-sm text-on-surface outline-none focus:border-[#F65C88] focus:ring-2 focus:ring-[#FFC9D2]/40 transition-all placeholder-on-surface-variant/40';

const readonlyCls =
  'w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm text-on-surface-variant/60 cursor-not-allowed flex items-center gap-2';

export const ProfileEditPage: React.FC = () => {
  const {
    draft, setDraft, isSaving, saved, errors,
    profile, loading, handleAvatarChange, handleBannerChange, removeBanner, handleSubmit,
  } = useProfileEditor();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const [shortlinkInput, setShortlinkInput] = useState('');
  const [shortlinkError, setShortlinkError] = useState('');
  const [shortlinkSaved, setShortlinkSaved] = useState(false);
  const [updateShortlink, { loading: shortlinkLoading }] = useMutation(UPDATE_SHORTLINK_MUTATION);

  const shortlinkCooldownDays = (() => {
    if (!profile.shortlinkUpdatedAt) return 0;
    const updated = new Date(profile.shortlinkUpdatedAt);
    const next = new Date(updated.getTime() + 10 * 24 * 60 * 60 * 1000);
    const remaining = Math.ceil((next.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return remaining > 0 ? remaining : 0;
  })();

  const handleShortlinkSave = async () => {
    setShortlinkError('');
    const sl = shortlinkInput.trim().toLowerCase();
    if (!sl) { setShortlinkError('Shortlink không được để trống'); return; }
    if (sl.length > 32) { setShortlinkError('Tối đa 32 ký tự'); return; }
    if (!/^[a-z0-9_-]+$/.test(sl)) { setShortlinkError('Chỉ chữ thường, số, - hoặc _'); return; }
    try {
      await updateShortlink({ variables: { shortlink: sl } });
      setShortlinkInput('');
      setShortlinkSaved(true);
      setTimeout(() => setShortlinkSaved(false), 3000);
      window.location.reload();
    } catch (e: unknown) {
      setShortlinkError((e as { message?: string }).message ?? 'Có lỗi xảy ra');
    }
  };

  const openCrop = (
    ref: React.RefObject<HTMLInputElement | null>,
    target: Omit<CropTarget, 'src'>,
  ) => {
    if (!ref.current) return;
    ref.current.value = '';
    ref.current.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setCropTarget({ src: URL.createObjectURL(file), ...target });
    };
    ref.current.click();
  };

  const handleCropConfirm = (blob: Blob) => {
    if (!cropTarget) return;
    const file = new File([blob], `${cropTarget.type}.jpg`, { type: blob.type });
    if (cropTarget.type === 'avatar') {
      handleAvatarChange(file);
    } else {
      handleBannerChange(file);
    }
    setCropTarget(null);
  };

  if (loading) {
    return (
      <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F65C88]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">

          {/* Hidden file inputs */}
          <input ref={avatarInputRef} type="file" accept={ACCEPT_IMG} className="hidden" />
          <input ref={bannerInputRef} type="file" accept={ACCEPT_IMG} className="hidden" />

          {/* Crop modal */}
          {cropTarget && (
            <CropModal
              imageSrc={cropTarget.src}
              aspect={cropTarget.aspect}
              shape={cropTarget.shape}
              title={cropTarget.title}
              onConfirm={handleCropConfirm}
              onCancel={() => setCropTarget(null)}
            />
          )}

          {/* Banner */}
          <div className="relative h-44 md:h-56 overflow-hidden group">
            {draft.bannerPreview ? (
              <img
                src={draft.bannerPreview}
                alt="banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FFAFB1] to-[#9AC6FF]" />
            )}

            {/* Banner overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <button
                onClick={() =>
                  openCrop(bannerInputRef, {
                    type: 'banner',
                    aspect: BANNER_ASPECT,
                    shape: 'rect',
                    title: 'Cắt ảnh bìa (3:1)',
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/90 text-[#040316] rounded-full text-xs font-bold shadow-md hover:bg-white transition-colors"
              >
                <Camera size={14} />
                Đổi ảnh bìa
              </button>
              {draft.bannerPreview && (
                <button
                  onClick={removeBanner}
                  className="flex items-center gap-2 px-4 py-2 bg-white/90 text-[#DB2E50] rounded-full text-xs font-bold shadow-md hover:bg-white transition-colors"
                >
                  <X size={14} />
                  Xoá
                </button>
              )}
            </div>

            {/* Back */}
            <Link
              to="/"
              className="absolute top-4 left-6 flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={15} />
              Quay lại
            </Link>
          </div>

          {/* Profile area */}
          <div className="px-6 md:px-12 pb-20">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 md:-mt-12 mb-6">
              <div
                className="relative shrink-0 group cursor-pointer"
                onClick={() =>
                  openCrop(avatarInputRef, {
                    type: 'avatar',
                    aspect: AVATAR_ASPECT,
                    shape: 'round',
                    title: 'Cắt ảnh đại diện (1:1)',
                  })
                }
              >
                <img
                  src={draft.avatarPreview}
                  alt="avatar"
                  className="w-20 h-20 md:w-28 md:h-28 rounded-3xl object-cover border-4 border-surface shadow-xl"
                />
                <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#F65C88] rounded-full p-1 shadow-md">
                  <CheckCircle2 size={13} className="text-white" />
                </div>
              </div>

              {/* Save button (top-right on desktop) */}
              <div className="hidden md:flex items-center gap-3 pb-2">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold animate-in fade-in slide-in-from-right-2">
                    <CheckCircle2 size={16} />
                    Đã lưu
                  </span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>

            <div className="max-w-2xl flex flex-col gap-8">

              {/* Basic info */}
              <section>
                <SectionLabel>Thông tin cơ bản</SectionLabel>
                <div className="flex flex-col gap-4">
                  <FieldWrapper label="Tên hiển thị" error={errors.displayName}>
                    <input
                      className={inputCls}
                      value={draft.displayName}
                      maxLength={50}
                      placeholder="Tên của bạn"
                      onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                    />
                    <p className="text-xs text-on-surface-variant/50 text-right">
                      {draft.displayName.length}/50
                    </p>
                  </FieldWrapper>

                  <FieldWrapper label="Handle">
                    <div className={readonlyCls}>
                      <Lock size={13} className="shrink-0" />
                      <span>@{profile.handle}</span>
                      <span className="ml-auto text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full">
                        Không thể thay đổi
                      </span>
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="Email">
                    <div className={readonlyCls}>
                      <Lock size={13} className="shrink-0" />
                      <span>{profile.email}</span>
                      <span className="ml-auto text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full">
                        Không thể thay đổi
                      </span>
                    </div>
                  </FieldWrapper>
                </div>
              </section>

              {/* Shortlink */}
              <section>
                <SectionLabel>Shortlink hồ sơ</SectionLabel>
                <div className="flex flex-col gap-4">
                  <FieldWrapper label="Shortlink hiện tại">
                    <div className={readonlyCls}>
                      <Link2 size={13} className="shrink-0" />
                      <span className="text-[#F65C88] font-medium">
                        lumine.dev/{profile.shortlink || '(chưa đặt)'}
                      </span>
                    </div>
                  </FieldWrapper>

                  {shortlinkCooldownDays > 0 ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                      <RefreshCw size={14} className="shrink-0" />
                      Còn <strong>{shortlinkCooldownDays} ngày</strong> nữa mới được đổi shortlink (giới hạn 10 ngày/lần).
                    </div>
                  ) : (
                    <FieldWrapper
                      label="Shortlink mới"
                      error={shortlinkError}
                      hint="Chỉ chữ thường, số, dấu - hoặc _. Tối đa 32 ký tự."
                    >
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center rounded-xl border border-outline-variant/40 bg-surface overflow-hidden focus-within:border-[#F65C88] focus-within:ring-2 focus-within:ring-[#FFC9D2]/40 transition-all">
                          <span className="pl-4 text-sm text-on-surface-variant/50 select-none whitespace-nowrap">
                            lumine.dev/
                          </span>
                          <input
                            className="flex-1 px-2 py-2.5 bg-transparent text-sm text-on-surface outline-none placeholder-on-surface-variant/40"
                            value={shortlinkInput}
                            onChange={(e) => setShortlinkInput(e.target.value.toLowerCase())}
                            placeholder={profile.shortlink || 'ten-cua-ban'}
                            maxLength={32}
                          />
                        </div>
                        <button
                          onClick={handleShortlinkSave}
                          disabled={shortlinkLoading || !shortlinkInput.trim()}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-sm whitespace-nowrap"
                        >
                          {shortlinkLoading ? <Loader2 size={14} className="animate-spin" /> : shortlinkSaved ? <CheckCircle2 size={14} /> : 'Lưu'}
                        </button>
                      </div>
                    </FieldWrapper>
                  )}
                </div>
              </section>

              {/* Bio */}
              <section>
                <SectionLabel>Giới thiệu bản thân</SectionLabel>
                <FieldWrapper label="Tiểu sử" error={errors.bio} hint="Hiển thị trên trang hồ sơ công khai của bạn">
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={4}
                    value={draft.bio}
                    maxLength={500}
                    placeholder="Kể về bạn, phong cách sáng tác, các tác phẩm bạn tự hào..."
                    onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                  />
                  <p className="text-xs text-on-surface-variant/50 text-right">
                    {draft.bio.length}/500
                  </p>
                </FieldWrapper>
              </section>

              {/* Specialties */}
              <section>
                <SectionLabel>Chuyên môn</SectionLabel>
                <FieldWrapper
                  label="Lĩnh vực"
                  hint="Nhập rồi nhấn Enter hoặc dấu phẩy. Tối đa 10 tag."
                >
                  <TagInput
                    tags={draft.specialties}
                    onChange={(tags) => setDraft((d) => ({ ...d, specialties: tags }))}
                    max={10}
                    placeholder="VD: Live2D, Illustration, VTuber..."
                  />
                </FieldWrapper>
              </section>

              {/* Social links */}
              <section>
                <SectionLabel>Mạng xã hội</SectionLabel>
                <div className="flex flex-col gap-4">
                  <FieldWrapper label="Website">
                    <div className="relative">
                      <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                      <input
                        className={`${inputCls} pl-9`}
                        type="url"
                        value={draft.socialLinks.website}
                        placeholder="https://yoursite.com"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            socialLinks: { ...d.socialLinks, website: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="Twitter / X">
                    <div className="relative">
                      <X size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                      <input
                        className={`${inputCls} pl-9`}
                        type="url"
                        value={draft.socialLinks.twitter}
                        placeholder="https://x.com/yourhandle"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            socialLinks: { ...d.socialLinks, twitter: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="Instagram">
                    <div className="relative">
                      <Link2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                      <input
                        className={`${inputCls} pl-9`}
                        type="url"
                        value={draft.socialLinks.instagram}
                        placeholder="https://instagram.com/yourhandle"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            socialLinks: { ...d.socialLinks, instagram: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </FieldWrapper>
                </div>
              </section>

            </div>
          </div>

          {/* Mobile sticky save */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 px-6 pb-2 bg-gradient-to-t from-surface via-surface to-transparent pt-4 z-30">
            {saved && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-semibold mb-2 animate-in fade-in">
                <CheckCircle2 size={16} />
                Đã lưu thành công
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90 disabled:opacity-60 transition-all shadow-md"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfileEditPage;
