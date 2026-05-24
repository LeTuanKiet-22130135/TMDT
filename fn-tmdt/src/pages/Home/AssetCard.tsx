import React from 'react';
import type { Asset } from './home.logic';

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <div className="group cursor-pointer relative">
      <div className="relative rounded-xl overflow-hidden bg-surface-container-lowest transition-all duration-300 group-hover:shadow-xl">
        <img 
          className="w-full h-auto block" 
          alt={asset.imageAlt} 
          src={asset.imageUrl}
        />
        <div className="absolute bottom-4 left-4 z-10 transition-transform duration-300 ease-out group-hover:-translate-y-[4.5rem]">
          <span className="px-4 py-2 bg-surface/90 backdrop-blur-md rounded-full text-sm font-bold shadow-sm">
            ${asset.price}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <h3 className="font-headline font-bold text-white text-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {asset.title}
          </h3>
          <p className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            Bởi {asset.author} • {asset.category}
          </p>
        </div>
      </div>
    </div>
  );
};
