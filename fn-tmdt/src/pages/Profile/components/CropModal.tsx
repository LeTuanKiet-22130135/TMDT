import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedBlob } from './cropImage';

interface Props {
  imageSrc: string;
  aspect: number;
  shape?: 'rect' | 'round';
  title?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export const CropModal: React.FC<Props> = ({
  imageSrc,
  aspect,
  shape = 'rect',
  title = 'Cắt ảnh',
  onConfirm,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-bold text-on-surface">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-black" style={{ height: 340 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid #F65C88',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-outline-variant/20">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#F65C88] cursor-pointer"
          />
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-xs text-on-surface-variant w-8 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white hover:opacity-90 disabled:opacity-60 transition-all"
          >
            <Check size={15} />
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};
