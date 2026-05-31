import { motion } from 'motion/react';
import { Product } from '../types';
import { MapPin, Heart, Eye, Crown } from 'lucide-react';
import React from 'react';
import { HighlightText } from './HighlightText';

interface ListingCardProps {
  product: Product;
  onClick: (id: string, product: Product) => void;
  searchQuery?: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}

const ListingCard: React.FC<ListingCardProps> = ({ product, onClick, searchQuery = '', isFavorite, onToggleFavorite, viewMode = 'grid' }) => {
  const isVip = product.plan === 'vip' || product.isVip;
  const isBronze = product.plan === 'bronze';
  const isList = viewMode === 'list';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(product.id, product)}
      className={`premium-card overflow-hidden transition-all duration-300 cursor-pointer group w-full ${
        isVip ? 'vip-border' : (isBronze ? 'bronze-border' : 'free-border')
      } ${
        isList 
          ? 'flex max-w-full' 
          : 'flex flex-col w-full'
      }`}
    >
      <div 
        className={`relative overflow-hidden shrink-0 flex items-center justify-center p-0 bg-[#0c0c0c] ${
        isList 
          ? 'h-24 w-24 sm:h-28 sm:w-28' 
          : 'w-full aspect-[4/3]'
      }`}>
        <img 
          src={product.imageUrls?.[0] || 'https://via.placeholder.com/400'} 
          alt={product.title} 
          loading="lazy"
          className="w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        
        {isVip && (
          <div className="absolute top-1.5 right-1.5 flex flex-col items-center gap-0 z-20 bg-black/60 backdrop-blur rounded p-0.5 sm:p-1">
            <Crown className="w-4 h-4 text-[#c5a059]" />
          </div>
        )}
      </div>

      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-[#c5a059] leading-snug line-clamp-2 transition-colors">
            <HighlightText text={product.title} query={searchQuery} />
          </h3>
          
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#c5a059] font-bold text-sm sm:text-base font-display tracking-tight">
              {product.price.toLocaleString()}
            </span>
            <span className="text-gray-400 text-[10px] font-medium mr-0.5">د.ت</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-gray-500 text-[9px] sm:text-[10px] mt-1 border-t border-gray-800/40 pt-1.5">
          <div className="flex items-center gap-1 opacity-80 min-w-0 flex-1 pl-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[10px] truncate">{product.location}</span>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id, e); }}
            className="flex items-center gap-1 select-none group/like bg-gray-900/40 hover:bg-gray-800/70 p-1 px-1.5 rounded-full transition-colors shrink-0"
          >
            <Heart className={`w-3 h-3 transition-transform group-hover/like:scale-110 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/like:text-red-400'}`} />
            <span className="text-gray-400 font-medium text-[9px] sm:text-[10px]">{product.likes || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ListingCard);
