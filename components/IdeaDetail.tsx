import React, { useState, useRef, useEffect } from 'react';
import { Idea } from '../types';
import { ArrowLeft, Copy, Check, Sparkles, MessageCircle, Send, Loader2, ListTodo, AlignLeft, ExternalLink, PenLine, Save, Zap, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createIdeaChat, expandIdea } from '../services/geminiService';
import { refineIdea } from '../services/refineService';

interface IdeaDetailProps {
  idea: Idea;
  onBack: () => void;
  onUpdate: (idea: Idea) => void;
}

const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea: initialIdea, onBack, onUpdate }) => {
  const [idea, setIdea] = useState(initialIdea);
  const [copied, setCopied] = useState<string | null>(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editTranscript, setEditTranscript] = useState(idea.transcript);

  // Deep Dive State
  const [isExpanding, setIsExpanding] = useState(false);

  // Refine State
  const [isRefining, setIsRefining] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveEdit = () => {
    const updatedIdea = { ...idea, title: editTitle, transcript: editTranscript };
    onUpdate(updatedIdea);
    setIdea(updatedIdea);
    setIsEditing(false);
  };

  const handleDeepDive = async () => {
    setIsExpanding(true);
    try {
      const expansionText = await expandIdea(idea);
      const updatedIdea = { ...idea, expansion: expansionText };
      onUpdate(updatedIdea);
      setIdea(updatedIdea);
    } catch (e) {
      alert("Could not generate Deep Dive. Try again.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const refinedData = await refineIdea(idea);
      const updatedIdea = {
        ...idea,
        title: refinedData.title || idea.title,
        summary: refinedData.summary || idea.summary,
        actionItems: refinedData.actionItems || idea.actionItems,
        tags: refinedData.tags || idea.tags,
      };
      onUpdate(updatedIdea);
      setIdea(updatedIdea);
    } catch (e) {
      alert("Could not refine idea. Try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const startChat = () => {
    if (!chatRef.current) {
      chatRef.current = createIdeaChat(idea);
    }
    setChatOpen(true);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I hit a snag. Can you try asking that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const categoryConfig = {
    'Work': 'from-sky-500 to-blue-600',
    'Personal': 'from-emerald-500 to-teal-600',
    'Creative': 'from-fuchsia-500 to-purple-600',
    'Other': 'from-slate-500 to-slate-600',
  }[idea.category];

  return (
    <div className="h-screen flex flex-col bg-background text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 glass sticky top-0 z-50 border-b border-white/5">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vault Entry</h2>
          <div className="text-[10px] text-primary font-mono">{idea.id.split('-')[0]}</div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveEdit}
              className="p-2.5 rounded-xl bg-primary text-background hover:scale-105 transition-all shadow-lg"
              aria-label="Save changes"
            >
              <Save className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Edit idea"
            >
              <PenLine className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => handleCopy(JSON.stringify(idea, null, 2), 'export')}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Export idea"
          >
            {copied === 'export' ? <Check className="w-5 h-5 text-emerald-400" /> : <ExternalLink className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title & Tags */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl md:text-4xl font-black text-white border-b border-white/20 focus:outline-none focus:border-primary pb-2"
                />
              ) : (
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">
                  {idea.title}
                </h1>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${categoryConfig} text-white font-bold text-xs`}>
                  {idea.category}
                </span>
                {idea.tags.map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Summary */}
            <section className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
              <h3 className="text-primary font-bold uppercase tracking-widest text-[10px] mb-3">Summary</h3>
              <p className="text-base md:text-lg text-slate-200 leading-relaxed">{idea.summary}</p>
            </section>

            {/* Deep Dive */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-fuchsia-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">AI Deep Dive</h3>
              </div>

              {idea.expansion ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="glass p-5 rounded-2xl border-l-4 border-fuchsia-500"
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    {idea.expansion.split('\n').map((line, i) => (
                      <p key={i} className={`mb-2 ${line === line.toUpperCase() && line.length > 3 ? 'font-bold text-fuchsia-200 mt-4 mb-2' : 'text-slate-300'}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={handleDeepDive}
                  disabled={isExpanding}
                  className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-fuchsia-500/50 transition-all group"
                >
                  {isExpanding ? (
                    <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mb-2" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-slate-600 group-hover:text-fuchsia-400 mb-2 transition-colors" />
                  )}
                  <span className="font-bold text-slate-500 group-hover:text-fuchsia-200 uppercase tracking-widest text-xs">
                    {isExpanding ? "Generating..." : "Generate Deep Dive"}
                  </span>
                </button>
              )}
            </section>

            {/* Action Items */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-secondary">
                <ListTodo className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">Action Items</h3>
              </div>
              <div className="grid gap-3">
                {idea.actionItems.map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i}
                    className="flex items-center p-4 glass rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-bold mr-4 text-sm">{i + 1}</div>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Transcript */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-500">
                <AlignLeft className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">Original Transcript</h3>
              </div>
              <div className="glass p-5 rounded-2xl">
                {isEditing ? (
                  <textarea
                    value={editTranscript}
                    onChange={(e) => setEditTranscript(e.target.value)}
                    className="w-full bg-transparent text-sm font-mono text-slate-300 leading-relaxed border border-white/10 rounded-xl p-4 focus:outline-none focus:border-primary h-48 resize-none"
                  />
                ) : (
                  <p className="font-mono text-sm leading-relaxed text-slate-400 italic">"{idea.transcript}"</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:sticky lg:top-20">
              {/* Image */}
              <div className="glass p-3 rounded-2xl overflow-hidden shadow-2xl mb-4">
                {idea.imageUrl ? (
                  <img src={idea.imageUrl} className="w-full h-40 md:h-56 object-cover rounded-xl" alt="" />
                ) : (
                  <div className="h-40 md:h-56 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center rounded-xl">
                    <Sparkles className="w-10 h-10 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startChat}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-background font-bold text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Brainstorm</span>
                </button>

                <button
                  onClick={handleRefine}
                  disabled={isRefining}
                  className="w-full py-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isRefining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span>{isRefining ? "Refining..." : "Refine with AI"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-x-0 bottom-0 h-[70vh] md:h-[60vh] glass z-[100] border-t border-primary/20 rounded-t-3xl shadow-2xl flex flex-col bg-surface"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-bold text-sm">AI Brainstormer</h4>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <p className="text-slate-400 text-sm max-w-xs">Ask anything about this idea. Gemini has full context.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-background font-medium' : 'glass text-slate-200'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass p-4 rounded-2xl flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs font-medium text-slate-500 animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 pb-6">
              <div className="relative">
                <input
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a question..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/30 text-white placeholder:text-slate-600 text-sm"
                />
                <button
                  onClick={sendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-background rounded-xl hover:scale-110 transition-transform"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IdeaDetail;