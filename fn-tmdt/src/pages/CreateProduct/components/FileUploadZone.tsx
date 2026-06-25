import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck2, X, File } from 'lucide-react';
import { ACCEPTED_ASSET_TYPES } from '../createProduct.logic';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const BYTES_PER_MB = 1024 * 1024;
const MAX_SIZE_MB = 500;

export const FileUploadZone: React.FC<Props> = ({ file, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (incoming: File) => {
    if (incoming.size > MAX_SIZE_MB * BYTES_PER_MB) return;
    onChange(incoming);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= BYTES_PER_MB) return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (file) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-[#FFC9D2]/60 bg-[#FFC9D2]/10">
        <div className="w-10 h-10 rounded-lg bg-[#FFC9D2]/40 flex items-center justify-center flex-shrink-0">
          <FileCheck2 size={20} className="text-[#F65C88]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#040316] truncate">{file.name}</p>
          <p className="text-xs text-[#040316]/50 mt-0.5">{formatSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-full hover:bg-[#FFC9D2]/40 text-[#040316]/40 hover:text-[#F65C88] transition-colors"
          aria-label="Xoá file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#F65C88] bg-[#FFC9D2]/20 scale-[1.01]'
            : error
            ? 'border-red-300 bg-red-50/50'
            : 'border-[#FFC9D2] bg-[#FFC9D2]/5 hover:border-[#F65C88] hover:bg-[#FFC9D2]/15'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          isDragging ? 'bg-[#FFC9D2]/50' : 'bg-[#FFC9D2]/30'
        }`}>
          {isDragging ? (
            <File size={26} className="text-[#F65C88]" />
          ) : (
            <UploadCloud size={26} className="text-[#F65C88]" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#040316]">
            {isDragging ? 'Thả file vào đây' : 'Kéo thả hoặc nhấn để chọn file'}
          </p>
          <p className="text-xs text-[#040316]/50 mt-1">
            PNG, JPG, PSD, AI, ZIP, MP4, .moc3, .cmo3 · Tối đa {MAX_SIZE_MB} MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_ASSET_TYPES}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
};
