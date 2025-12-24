import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Bookmark, BarChart3, Sparkles } from 'lucide-react';
import { Idea } from '../types';

interface DashboardStatsProps {
    ideas: Idea[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ ideas }) => {
    const stats = [
        { label: 'Active Concepts', value: ideas.length, icon: BrainCircuit, color: 'primary' },
        { label: 'High Priority', value: ideas.filter(i => i.isFavorite).length, icon: Bookmark, color: 'fuchsia' },
        { label: 'Tasks Defined', value: ideas.reduce((a, b) => a + b.actionItems.length, 0), icon: BarChart3, color: 'emerald' },
        { label: 'AI Renderings', value: ideas.filter(i => i.imageUrl).length, icon: Sparkles, color: 'sky' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 lg:mb-20">
            {stats.map((stat, i) => (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label}
                    className="glass p-4 lg:p-7 rounded-2xl lg:rounded-[2rem] flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-5 hover:border-primary/30 transition-colors min-h-[100px] lg:min-h-[auto]"
                >
                    <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                        <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                        <div className="text-2xl lg:text-3xl font-black text-white">{stat.value}</div>
                        <div className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">{stat.label}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default DashboardStats;
