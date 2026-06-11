import React from 'react';
import { Link } from 'react-router-dom';
import type { Asset } from './home.logic';

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const formattedPrice = asset.price.toLocaleString('vi-VN');

  return (
    <Link to={`/asset/${asset.id}`} className="group cursor-pointer block relative">
      <div className="relative rounded-2xl overflow-hidden bg-surface-container-lowest transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">
        <img 
          className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-105" 
          alt={asset.imageAlt} 
          src={asset.imageUrl}
        />
        
        {/* Lớp phủ mặc định (để hiển thị thông tin khi chưa hover và tối ưu độ tương phản) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end pt-12">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img 
                src={asset.authorAvatar} 
                alt={asset.author} 
                className="w-7 h-7 rounded-full border border-white/20 object-cover"
              />
              <div className="text-white">
                <p className="text-[10px] opacity-75 font-medium leading-none">{asset.author}</p>
                <h3 className="font-headline font-bold text-xs md:text-sm line-clamp-1 mt-0.5">
                  {asset.title}
                </h3>
              </div>
            </div>
            
            <span className="shrink-0 px-2.5 py-1 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-full text-[10px] md:text-xs font-bold shadow-sm transition-all duration-200">
              {formattedPrice} VND
            </span>
          </div>
        </div>

        {/* Lớp phủ tương tác Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="px-4 py-2 bg-white/95 text-[#F65C88] font-bold text-xs rounded-full shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
            Xem chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
};
