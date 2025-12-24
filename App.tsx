import React, { useState, useEffect, useRef } from 'react';
import { Idea, ViewMode } from './types';
import { getIdeas, saveIdea, deleteIdea, toggleFavorite, exportVault, importVault, migrateFromLocalStorage } from './services/storageService';
import { processAudioIdea } from './services/geminiService';
import RecordingInterface from './components/RecordingInterface';
import IdeaCard from './components/IdeaCard';
import IdeaDetail from './components/IdeaDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search, BrainCircuit, Zap, Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      const storedIdeas = await getIdeas();
      setIdeas(storedIdeas);
    };
    init();
  }, []);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const processedData = await processAudioIdea(blob, setStatusMessage);
      const newIdea: Idea = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...processedData,
        isFavorite: false,
      };
      await saveIdea(newIdea);
      const updatedIdeas = await getIdeas();
      setIdeas(updatedIdeas);
      setViewMode('list');
    } catch (error) {
      setError("Analysis failed. Please try a clearer or longer voice note.");
      setTimeout(() => setError(null), 5000);
      setViewMode('list');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (await importVault(content)) {
        const updatedIdeas = await getIdeas();
        setIdeas(updatedIdeas);
        alert("Vault restored successfully!");
        setIsMobileMenuOpen(false);
      } else {
        alert("Failed to import vault. File format might be invalid.");
      }
    };
    reader.readAsText(file);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      filterCategory === 'All' ||
      (filterCategory === 'fav' ? idea.isFavorite : idea.category === filterCategory);
    return matchesSearch && matchesCategory;
  });


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

  if (viewMode === 'detail' && selectedIdea) {
    return <IdeaDetail idea={selectedIdea} onBack={() => { setSelectedIdea(null); setViewMode('list'); }} />;
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col glass border-r border-white/5 p-8 z-50">
        <Sidebar
          ideasCount={ideas.length}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onImport={handleImport}
        />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl p-8 flex flex-col lg:hidden"
          >
            <Sidebar
              isMobile
              ideasCount={ideas.length}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              onImport={handleImport}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Experience */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-8 lg:py-12 no-scrollbar scroll-smooth">
        {/* Mobile Header Controls */}
        <div className="lg:hidden flex justify-between items-center mb-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 rounded-xl glass text-slate-300"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <span className="font-black text-white tracking-tighter uppercase">IdeaFlow</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:gap-10 mb-8 lg:mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center space-x-3 text-primary mb-2 lg:mb-4">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em]">Personal Mind Palace</span>
            </div>
            <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-none">
              The Vault
            </h2>
          </motion.div>

          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface/40 backdrop-blur-xl border border-white/10 rounded-[2rem] py-4 lg:py-6 pl-12 lg:pl-16 pr-6 lg:pr-8 text-sm text-white focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-slate-700"
            />
          </div>
        </header>

        {/* Dashboard Metrics */}
        <DashboardStats ideas={ideas} />

        {/* Dynamic Category Navigation */}
        <div className="flex items-center gap-4 mb-8 lg:mb-12 overflow-x-auto no-scrollbar pb-4 sticky top-0 z-40 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="p-1.5 lg:p-2 glass rounded-full flex items-center gap-1 lg:gap-2">
            {['All', 'Work', 'Personal', 'Creative', 'Other'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-5 lg:px-8 py-2.5 lg:py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-white text-background shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Flow */}
        <AnimatePresence mode="popLayout">
          {filteredIdeas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
              className="h-[50vh] flex flex-col items-center justify-center text-center px-4"
            >
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 lg:mb-10 border border-white/5 shadow-inner">
                <BrainCircuit className="w-10 h-10 lg:w-14 lg:h-14 text-slate-700" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] lg:text-sm mb-8">Waiting for your first spark</p>
              <button
                onClick={() => setViewMode('record')}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 transition-all active:scale-95"
              >
                Capture a Thought
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-10 pb-32 lg:pb-40">
              {filteredIdeas.map((idea, idx) => (
                <IdeaCard
                  key={idea.id}
                  index={idx}
                  idea={idea}
                  onClick={() => { setSelectedIdea(idea); setViewMode('detail'); }}
                  onDelete={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to erase this spark? This cannot be undone.")) {
                      await deleteIdea(idea.id);
                      setIdeas(await getIdeas());
                    }
                  }}
                  onToggleFavorite={async (e) => {
                    e.stopPropagation();
                    await toggleFavorite(idea.id);
                    setIdeas(await getIdeas());
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Error Messaging */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] glass px-8 py-4 border border-red-500/30 text-red-200 rounded-2xl flex items-center space-x-3 shadow-2xl"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setViewMode('record')}
        className="fixed bottom-6 right-6 w-16 h-16 lg:bottom-12 lg:right-12 lg:w-24 lg:h-24 bg-primary text-background rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_10px_40px_rgba(56,189,248,0.5)] flex items-center justify-center z-[60] group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
        <Mic className="w-6 h-6 lg:w-10 lg:h-10 font-black group-hover:animate-bounce-small" />
      </motion.button>
    </div>
  );
};

export default App;