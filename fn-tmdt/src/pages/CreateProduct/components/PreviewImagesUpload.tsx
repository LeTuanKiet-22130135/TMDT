import React, { useRef } from 'react';
import { ImagePlus, X, GripVertical } from 'lucide-react';
import { ACCEPTED_PREVIEW_TYPES, MAX_PREVIEW_IMAGES } from '../createProduct.logic';
import type { PreviewImage } from '../createProduct.logic';

interface Props {
  images: PreviewImage[];
  onChange: (images: PreviewImage[]) => void;
  error?: string;
}

export const PreviewImagesUpload: React.FC<Props> = ({ images, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const remaining = MAX_PREVIEW_IMAGES - images.length;
    if (remaining <= 0) return;

    const incoming: PreviewImage[] = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      }));

    onChange([...images, ...incoming]);
  };

  const handleRemove = (id: string) => {
    const removed = images.find((img) => img.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    onChange(images.filter((img) => img.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const canAddMore = images.length < MAX_PREVIEW_IMAGES;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((img, index) => (
          <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-[#FFC9D2]/50 bg-[#FFC9D2]/10">
            <img src={img.url} alt={`preview-${index + 1}`} className="w-full h-full object-cover" />

            {/* Order badge */}
            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 text-white text-[10px] font-bold flex items-center justify-center">
              {index + 1}
            </div>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <div className="p-1 rounded-full bg-white/20 cursor-grab" title="Kéo để sắp xếp">
                <GripVertical size={14} className="text-white" />
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#F65C88]"
              aria-label="Xoá ảnh"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Add more slot */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="aspect-square rounded-xl border-2 border-dashed border-[#FFC9D2] hover:border-[#F65C88] hover:bg-[#FFC9D2]/10 transition-all flex flex-col items-center justify-center gap-1.5 text-[#040316]/40 hover:text-[#F65C88]"
          >
            <ImagePlus size={20} />
            <span className="text-[10px] font-medium">Thêm ảnh</span>
          </button>
        )}
      </div>

      {/* Count indicator */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-[#040316]/40">
          {images.length}/{MAX_PREVIEW_IMAGES} ảnh · Ảnh đầu tiên là ảnh bìa
        </p>
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => { images.forEach((img) => URL.revokeObjectURL(img.url)); onChange([]); }}
            className="text-xs text-[#040316]/40 hover:text-red-400 transition-colors"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PREVIEW_TYPES}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
};
