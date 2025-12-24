import React, { memo } from 'react';
import { Idea } from '../types';
import { Tag, Bookmark, Trash2, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface IdeaCardProps {
  idea: Idea;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, onClick, onDelete, onToggleFavorite }) => {
  const categoryStyles = {
    'Work': 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20',
    'Personal': 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    'Creative': 'from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/20',
    'Other': 'from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20',
  }[idea.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className="group relative flex flex-col h-auto glass rounded-3xl md:rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-xl lg:shadow-2xl border-white/5"
    >
      {/* Visual Header */}
      <div className="relative w-full bg-slate-900 overflow-hidden shrink-0 aspect-video md:aspect-square"> {/* Removed fixed height, using aspect ratio */}
        {idea.imageUrl ? (
          <motion.img
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
            src={idea.imageUrl}
            alt={idea.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <Zap className="w-10 h-10 text-slate-800" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 lg:top-4 lg:right-4 flex space-x-2 translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300 opacity-100">
          <button
            onClick={onToggleFavorite}
            className={`p-2 lg:p-2.5 rounded-xl lg:rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg ${idea.isFavorite ? 'bg-yellow-500 text-white' : 'bg-black/60 text-white hover:bg-primary'}`}
          >
            <Bookmark className={`w-3 h-3 lg:w-4 lg:h-4 ${idea.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 lg:p-2.5 rounded-xl lg:rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:bg-red-500 shadow-lg transition-colors"
          >
            <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-7 flex flex-col">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <span className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest border rounded-lg bg-gradient-to-r ${categoryStyles}`}>
            {idea.category}
          </span>
          <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {new Date(idea.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {idea.title}
        </h3>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
          {idea.summary}
        </p>

        <div className="mt-auto pt-4 md:pt-5 flex items-center justify-between border-t border-white/5">
          <div className="flex flex-wrap gap-1">
            {idea.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-[8px] md:text-[9px] font-bold text-primary/70 uppercase">#{tag}</span>
            ))}
          </div>
          <motion.div
            whileHover={{ x: 5 }}
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-background transition-colors"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(IdeaCard);