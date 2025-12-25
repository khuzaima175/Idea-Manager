import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Idea, ViewMode } from './types';
import { getIdeas, saveIdea, deleteIdea, toggleFavorite, exportVault, importVault } from './services/storageService';
import { processAudioIdea, processTextIdea } from './services/geminiService';
import RecordingInterface from './components/RecordingInterface';
import IdeaCard from './components/IdeaCard';
import IdeaDetail from './components/IdeaDetail';
import TextIdeaModal from './components/TextIdeaModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Search, BrainCircuit, Sparkles, LayoutDashboard, Bookmark, Zap, BarChart3,
  TrendingUp, Download, Upload, ShieldCheck, Database, Menu, X, Undo2, Tag,
  CheckCircle2, Settings, Image as ImageIcon, Keyboard, PenLine, ArrowUpDown,
  Calendar, Type as TypeIcon, FolderOpen
} from 'lucide-react';

// Types
type SidebarTab = 'dashboard' | 'favorites' | 'stats';
type SortOption = 'newest' | 'oldest' | 'title' | 'category';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  // Filtering & Sorting State
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // App Settings
  const [generateImages, setGenerateImages] = useState(true);

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<Idea | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isTextProcessing, setIsTextProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIdeas(getIdeas()); }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          if (viewMode === 'list') setViewMode('record');
          break;
        case 't':
          if (viewMode === 'list') setIsTextModalOpen(true);
          break;
        case 'escape':
          if (isTextModalOpen) setIsTextModalOpen(false);
          else if (viewMode === 'detail') { setSelectedIdea(null); setViewMode('list'); }
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isTextModalOpen]);

  // Helpers
  const triggerSaveNotification = (msg: string) => {
    setSaveNotification(msg);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  // Handlers
  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const processedData = await processAudioIdea(blob, setStatusMessage, generateImages);
      const newIdea: Idea = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...processedData,
        isFavorite: false,
      };
      saveIdea(newIdea);
      setIdeas(getIdeas());
      triggerSaveNotification("Idea captured & saved to vault");
      setViewMode('list');
    } catch (error) {
      alert("Something went wrong processing your thought. Please try again.");
      setViewMode('list');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleTextSubmit = async (text: string) => {
    setIsTextProcessing(true);
    try {
      const processedData = await processTextIdea(text, setStatusMessage, generateImages);
      const newIdea: Idea = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...processedData,
        isFavorite: false,
      };
      saveIdea(newIdea);
      setIdeas(getIdeas());
      triggerSaveNotification("Idea captured & saved to vault");
      setIsTextModalOpen(false);
    } catch (error) {
      alert("Something went wrong processing your thought. Please try again.");
    } finally {
      setIsTextProcessing(false);
      setStatusMessage('');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ideaToDelete = ideas.find(i => i.id === id);
    if (ideaToDelete) {
      setUndoStack(ideaToDelete);
      deleteIdea(id);
      setIdeas(getIdeas());
      triggerSaveNotification("Item moved to trash");
      setTimeout(() => setUndoStack(current => current?.id === id ? null : current), 4000);
    }
  };

  const handleUndo = () => {
    if (undoStack) {
      saveIdea(undoStack);
      setIdeas(getIdeas());
      setUndoStack(null);
      triggerSaveNotification("Deletion undone");
    }
  };

  const handleUpdateIdea = (updatedIdea: Idea) => {
    saveIdea(updatedIdea);
    setIdeas(getIdeas());
    setSelectedIdea(updatedIdea);
    triggerSaveNotification("Changes saved successfully");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importVault(content)) {
        setIdeas(getIdeas());
        triggerSaveNotification("Vault restored from backup");
        setIsMobileMenuOpen(false);
      } else {
        alert("Failed to import vault. File format might be invalid.");
      }
    };
    reader.readAsText(file);
  };

  // Filtering & Sorting Logic
  const filteredAndSortedIdeas = useMemo(() => {
    let result = ideas.filter(idea => {
      if (activeTab === 'favorites' && !idea.isFavorite) return false;
      if (filterCategory !== 'All' && idea.category !== filterCategory) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(term);
        const matchesTags = idea.tags.some(tag => tag.toLowerCase().includes(term));
        const matchesSummary = idea.summary.toLowerCase().includes(term);
        if (!matchesTitle && !matchesTags && !matchesSummary) return false;
      }
      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'oldest':
        result = [...result].sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'title':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        result = [...result].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [ideas, activeTab, filterCategory, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const allTags = ideas.flatMap(i => i.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sortedTags = Object.entries(tagCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

    return {
      totalIdeas: ideas.length,
      totalWords: ideas.reduce((acc, i) => acc + (i.transcript ? i.transcript.split(' ').length : 0), 0),
      topTags: sortedTags,
      categoryDist: {
        Work: ideas.filter(i => i.category === 'Work').length,
        Personal: ideas.filter(i => i.category === 'Personal').length,
        Creative: ideas.filter(i => i.category === 'Creative').length,
        Other: ideas.filter(i => i.category === 'Other').length,
      }
    };
  }, [ideas]);

  // Sort Options
  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: 'Newest First', icon: <Calendar className="w-4 h-4" /> },
    { value: 'oldest', label: 'Oldest First', icon: <Calendar className="w-4 h-4" /> },
    { value: 'title', label: 'By Title', icon: <TypeIcon className="w-4 h-4" /> },
    { value: 'category', label: 'By Category', icon: <FolderOpen className="w-4 h-4" /> },
  ];

  // Sidebar Content
  const SidebarContent = () => (
    <>
      <div className="flex items-center space-x-4 mb-8 lg:mb-12">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-black text-white tracking-tight">IdeaFlow</span>
          <p className="text-[10px] text-slate-500 font-medium">AI-Powered Mind Palace</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setViewMode('list'); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-primary to-primary/80 text-background font-black shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-background' : 'group-hover:text-primary'}`} />
          <span className="text-sm font-bold">Main Hub</span>
        </button>

        <button
          onClick={() => { setActiveTab('favorites'); setViewMode('list'); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${activeTab === 'favorites' ? 'bg-gradient-to-r from-primary to-primary/80 text-background font-black shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <Bookmark className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-background' : 'group-hover:text-primary'}`} />
          <span className="text-sm font-bold">Starred</span>
          {ideas.filter(i => i.isFavorite).length > 0 && (
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
              {ideas.filter(i => i.isFavorite).length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('stats'); setViewMode('stats'); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${activeTab === 'stats' ? 'bg-gradient-to-r from-primary to-primary/80 text-background font-black shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <TrendingUp className={`w-5 h-5 ${activeTab === 'stats' ? 'text-background' : 'group-hover:text-primary'}`} />
          <span className="text-sm font-bold">Vault Stats</span>
        </button>

        {/* Config Section */}
        <div className="pt-8 pb-4">
          <h4 className="px-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Settings className="w-3 h-3" />
            Settings
          </h4>

          <div className="px-5 py-3 mb-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center space-x-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm font-medium">AI Art Generation</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={generateImages}
                  onChange={() => setGenerateImages(!generateImages)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
            {!generateImages && (
              <p className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Faster processing enabled
              </p>
            )}
          </div>

          <div className="h-px bg-white/5 mx-5 my-4" />

          <h4 className="px-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Vault Management</h4>
          <button onClick={exportVault} className="w-full flex items-center space-x-4 px-5 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
            <Download className="w-4 h-4 group-hover:text-emerald-400" />
            <span className="text-sm font-medium">Backup Vault</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-4 px-5 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
            <Upload className="w-4 h-4 group-hover:text-amber-400" />
            <span className="text-sm font-medium">Restore Vault</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4">
        {/* Keyboard Shortcuts Hint */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 mb-4">
          <div className="flex items-center space-x-2 mb-3 text-slate-400">
            <Keyboard className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">N</kbd>
              <span className="text-slate-500">Voice</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">T</kbd>
              <span className="text-slate-500">Text</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">/</kbd>
              <span className="text-slate-500">Search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">Esc</kbd>
              <span className="text-slate-500">Back</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mb-4">
          <div className="flex items-center space-x-3 mb-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Local-First</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Your data stays in your browser. Use <b>Backup</b> to sync across devices.
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 px-2">
          <div className="flex items-center space-x-2">
            <Database className="w-3 h-3" />
            <span>{ideas.length} Ideas</span>
          </div>
          <span className="text-primary">v2.0</span>
        </div>
      </div>
    </>
  );

  // Recording View
  if (viewMode === 'record' || isProcessing) {
    return (
      <RecordingInterface
        onRecordingComplete={handleRecordingComplete}
        onCancel={() => setViewMode('list')}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
      />
    );
  }

  // Detail View
  if (viewMode === 'detail' && selectedIdea) {
    return (
      <IdeaDetail
        idea={selectedIdea}
        onBack={() => { setSelectedIdea(null); setViewMode('list'); }}
        onUpdate={handleUpdateIdea}
      />
    );
  }

  // Main View
  return (
    <div className="h-screen bg-background flex overflow-hidden selection:bg-primary/30 relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col glass border-r border-white/5 p-6 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl p-6 flex flex-col lg:hidden"
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-surface border border-white/10 text-slate-400"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Modal */}
      <TextIdeaModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSubmit={handleTextSubmit}
        isProcessing={isTextProcessing}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 py-6 lg:py-10 no-scrollbar scroll-smooth">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 rounded-xl glass text-slate-300"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <span className="font-black text-white tracking-tight">IdeaFlow</span>
          </div>
          <div className="w-12" />
        </div>

        {viewMode === 'stats' ? (
          /* Stats View */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <header>
              <h2 className="text-3xl lg:text-6xl font-black text-white tracking-tight mb-2">Vault Stats</h2>
              <p className="text-slate-400">Visualizing {stats.totalIdeas} ideas and {stats.totalWords} words captured.</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.categoryDist).map(([cat, count]) => (
                <div key={cat} className="glass p-5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{cat}</h4>
                  <div className="text-3xl font-black text-white">{count}</div>
                  <div className="w-full bg-white/10 h-1.5 mt-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.totalIdeas as number) > 0 ? ((count as number) / (stats.totalIdeas as number)) * 100 : 0}%` }}
                      className="bg-gradient-to-r from-primary to-secondary h-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-lg font-bold text-white">Concept Cloud</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 font-medium hover:bg-primary/20 hover:text-primary transition-colors cursor-default"
                    style={{ fontSize: `${Math.max(0.75, 0.875 + (count / 10))}rem` }}
                  >
                    #{tag} <span className="text-xs opacity-50 ml-1">{count}</span>
                  </span>
                ))}
                {stats.topTags.length === 0 && <p className="text-slate-500 italic">No tags yet. Start recording ideas!</p>}
              </div>
            </div>
          </motion.div>
        ) : (
          /* List View */
          <>
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-12">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center space-x-2 text-primary mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Personal Mind Palace</span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                  {activeTab === 'favorites' ? 'Starred Ideas' : 'The Vault'}
                </h2>
              </motion.div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-[320px] group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="p-4 glass rounded-2xl text-slate-400 hover:text-white transition-colors"
                    aria-label="Sort options"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        {sortOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${sortBy === opt.value ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>

            {/* Dashboard Metrics */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8 lg:mb-12">
                {[
                  { label: 'Active Concepts', value: ideas.length, icon: BrainCircuit, gradient: 'from-sky-500 to-blue-600' },
                  { label: 'Starred', value: ideas.filter(i => i.isFavorite).length, icon: Bookmark, gradient: 'from-amber-500 to-orange-600' },
                  { label: 'Action Items', value: ideas.reduce((a: number, b) => a + b.actionItems.length, 0), icon: BarChart3, gradient: 'from-emerald-500 to-teal-600' },
                  { label: 'AI Renderings', value: ideas.filter(i => i.imageUrl).length, icon: Sparkles, gradient: 'from-purple-500 to-fuchsia-600' },
                ].map((stat, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={stat.label}
                    className="glass p-4 lg:p-5 rounded-2xl flex items-center space-x-4 hover:border-white/20 transition-colors group"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl lg:text-3xl font-black text-white">{stat.value}</div>
                      <div className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-6 lg:mb-10 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="p-1 glass rounded-full flex items-center gap-1">
                {['All', 'Work', 'Personal', 'Creative', 'Other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 lg:px-6 py-2.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filterCategory === cat
                      ? 'bg-white text-background shadow-lg'
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ideas Grid */}
            <AnimatePresence mode="popLayout">
              {filteredAndSortedIdeas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-[50vh] flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                    <BrainCircuit className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeTab === 'favorites' ? 'No starred ideas yet' : 'Your vault is empty'}
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-sm">
                    {activeTab === 'favorites'
                      ? 'Star your favorite ideas to find them here'
                      : 'Capture your first spark by recording a voice note or typing an idea'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewMode('record')}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                      <Mic className="w-4 h-4" />
                      Record
                    </button>
                    <button
                      onClick={() => setIsTextModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-surface border border-white/10 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                      <PenLine className="w-4 h-4" />
                      Type
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-32">
                  {filteredAndSortedIdeas.map((idea, idx) => (
                    <IdeaCard
                      key={idea.id}
                      index={idx}
                      idea={idea}
                      onClick={() => { setSelectedIdea(idea); setViewMode('detail'); }}
                      onDelete={(e) => handleDelete(e, idea.id)}
                      onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(idea.id); setIdeas(getIdeas()); }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Floating Action Buttons */}
      {viewMode === 'list' && (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 flex flex-col gap-3 z-[60]">
          {/* Text Input Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsTextModalOpen(true)}
            className="w-14 h-14 lg:w-16 lg:h-16 bg-surface border border-white/10 text-white rounded-2xl shadow-2xl flex items-center justify-center group"
            aria-label="Type an idea"
          >
            <PenLine className="w-5 h-5 lg:w-6 lg:h-6 group-hover:text-primary transition-colors" />
          </motion.button>

          {/* Voice Recording Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('record')}
            className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary to-secondary text-background rounded-2xl shadow-[0_10px_40px_rgba(56,189,248,0.4)] flex items-center justify-center group overflow-hidden"
            aria-label="Record a voice note"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            <Mic className="w-7 h-7 lg:w-8 lg:h-8" />
          </motion.button>
        </div>
      )}

      {/* Undo Toast */}
      <AnimatePresence>
        {undoStack && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-surface/95 backdrop-blur-xl border border-white/10 py-3 px-5 rounded-2xl shadow-2xl"
          >
            <span className="text-sm font-medium text-slate-300">Idea deleted</span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 text-primary font-bold text-sm hover:text-white transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Notification Toast */}
      <AnimatePresence>
        {saveNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-100">{saveNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;