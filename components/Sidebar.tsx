import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    BrainCircuit, LayoutDashboard, Bookmark, TrendingUp,
    Download, Upload, ShieldCheck, Database, X
} from 'lucide-react';
import { exportVault } from '../services/storageService';

interface SidebarProps {
    ideasCount: number;
    filterCategory: string;
    setFilterCategory: (cat: string) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose?: () => void;
    isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    ideasCount,
    filterCategory,
    setFilterCategory,
    onImport,
    onClose,
    isMobile
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItems = [
        { id: 'All', label: 'Main Hub', icon: LayoutDashboard },
        { id: 'fav', label: 'Starred', icon: Bookmark },
        { id: 'ins', label: 'Vault Stats', icon: TrendingUp },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 lg:mb-12 shrink-0">
                <div className="flex items-center space-x-4">
                    <motion.div
                        animate={{ rotate: [0, 90, 180, 270, 360] }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40"
                    >
                        <BrainCircuit className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-xl font-black text-white tracking-tighter uppercase">IdeaFlow</span>
                </div>
                {isMobile && (
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <nav className="space-y-2 flex-1">
                {navItems.map(nav => (
                    <button
                        key={nav.id}
                        onClick={() => {
                            setFilterCategory(nav.id);
                            if (onClose) onClose();
                        }}
                        className={`w-full flex items-center space-x-4 px-5 py-3 rounded-2xl transition-all group ${filterCategory === nav.id
                            ? 'bg-primary text-background font-black'
                            : 'text-slate-500 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <nav.icon className={`w-4 h-4 ${filterCategory === nav.id ? 'text-background' : 'group-hover:text-primary'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">{nav.label}</span>
                    </button>
                ))}

                <div className="pt-8 pb-4">
                    <h4 className="px-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Vault Management</h4>
                    <button onClick={exportVault} className="w-full flex items-center space-x-4 px-5 py-3 rounded-2xl text-slate-500 hover:bg-white/5 hover:text-white transition-all group">
                        <Download className="w-4 h-4 group-hover:text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Backup Vault</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-4 px-5 py-3 rounded-2xl text-slate-500 hover:bg-white/5 hover:text-white transition-all group">
                        <Upload className="w-4 h-4 group-hover:text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Restore Vault</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onImport}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </nav>

            <div className="mt-auto pt-4 shrink-0">
                <div className="bg-surface/40 p-4 lg:p-5 rounded-2xl border border-white/5 mb-4">
                    <div className="flex items-center space-x-3 mb-2 text-emerald-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Local-First Privacy</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Your data is stored strictly in this browser. Use <b>Backup</b> to move ideas between devices.
                    </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 px-2">
                    <div className="flex items-center space-x-2">
                        <Database className="w-3 h-3" />
                        <span>{ideasCount} Entries</span>
                    </div>
                    <span>v1.2 Stable</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
