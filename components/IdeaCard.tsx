import React from 'react';
import { Idea } from '../types';
import { Bookmark, Trash2, ChevronRight, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface IdeaCardProps {
  idea: Idea;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, onClick, onDelete, onToggleFavorite }) => {
  const categoryConfig = {
    'Work': { gradient: 'from-sky-500 to-blue-600', text: 'text-sky-400', bg: 'bg-sky-500/10' },
    'Personal': { gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'Creative': { gradient: 'from-fuchsia-500 to-purple-600', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    'Other': { gradient: 'from-slate-500 to-slate-600', text: 'text-slate-400', bg: 'bg-slate-500/10' },
  }[idea.category];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
      onClick={onClick}
      className="group relative flex flex-col h-auto min-h-[260px] lg:min-h-[320px] bg-gradient-to-br from-surface to-surface/80 border border-white/5 rounded-2xl lg:rounded-3xl overflow-hidden hover:border-white/10 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xl hover:shadow-2xl"
    >
      {/* Visual Header */}
      <div className="relative h-28 lg:h-40 w-full bg-slate-900 overflow-hidden shrink-0">
        {idea.imageUrl ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            src={idea.imageUrl}
            alt={idea.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${categoryConfig.gradient} opacity-20`}>
            <Zap className="w-12 h-12 text-white/30" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${categoryConfig.bg} ${categoryConfig.text} rounded-lg backdrop-blur-sm border border-white/5`}>
            {idea.category}
          </span>
        </div>

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleFavorite}
            className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-lg transition-all ${idea.isFavorite
              ? 'bg-amber-500 text-white'
              : 'bg-black/40 text-white/80 hover:bg-amber-500/80 hover:text-white'
              }`}
            aria-label={idea.isFavorite ? "Remove from starred" : "Add to starred"}
          >
            <Bookmark className={`w-4 h-4 ${idea.isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:bg-red-500 hover:text-white shadow-lg transition-all"
            aria-label="Delete idea"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 lg:p-5 flex flex-col">
        <h3 className="text-base lg:text-lg font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {idea.title}
        </h3>
        <p className="text-slate-400 text-xs lg:text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
          {idea.summary}
        </p>

        <div className="pt-3 flex items-center justify-between border-t border-white/5">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-[9px] lg:text-[10px] font-bold text-primary/70 uppercase">#{tag}</span>
            ))}
            {idea.tags.length > 2 && (
              <span className="text-[9px] text-slate-600">+{idea.tags.length - 2}</span>
            )}
          </div>

          {/* Date & Arrow */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[9px] lg:text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              {formatDate(idea.createdAt)}
            </div>
            <motion.div
              whileHover={{ x: 3 }}
              className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-background transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Favorite Indicator */}
      {idea.isFavorite && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500" />
      )}
    </motion.div>
  );
};

export default IdeaCard;