import React, { useState, useRef, useEffect } from 'react';
import { Idea } from '../types';
import { ArrowLeft, Copy, Check, Sparkles, MessageCircle, Send, Loader2, ListTodo, AlignLeft, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createIdeaChat } from '../services/geminiService';

interface IdeaDetailProps {
  idea: Idea;
  onBack: () => void;
}

const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea, onBack }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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

  return (
    <div className="h-screen flex flex-col bg-background text-slate-100 overflow-hidden">
      {/* Dynamic Header */}
      <header className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6 glass sticky top-0 z-50">
        <button onClick={onBack} className="p-2 md:p-3 rounded-2xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-slate-500">Vault Entry</h2>
          <div className="text-[10px] md:text-xs text-primary font-mono">{idea.id.split('-')[0]}</div>
        </div>
        <button 
          onClick={() => handleCopy(JSON.stringify(idea, null, 2), 'export')} 
          className="p-2 md:p-3 rounded-2xl hover:bg-white/10 transition-colors"
        >
          {copied === 'export' ? <Check className="w-5 h-5 text-emerald-400" /> : <ExternalLink className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tighter mb-6 md:mb-8">
                {idea.title}
              </h1>
              <div className="flex flex-wrap gap-2 md:gap-4">
                <span className="px-3 py-1.5 md:px-5 md:py-2 rounded-2xl glass text-primary font-bold text-xs md:text-sm">#{idea.category}</span>
                {idea.tags.map(t => <span key={t} className="px-3 py-1.5 md:px-5 md:py-2 rounded-2xl glass text-slate-500 font-bold text-xs md:text-sm">#{t}</span>)}
              </div>
            </motion.div>

            <section className="glass p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 md:top-8 md:right-8 w-5 h-5 md:w-6 md:h-6 text-primary/20" />
              <h3 className="text-primary font-black uppercase tracking-widest text-[10px] md:text-xs mb-4 md:mb-6">Abstract Summary</h3>
              <p className="text-base md:text-xl text-slate-200 leading-relaxed font-medium">{idea.summary}</p>
            </section>

            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-3 text-secondary">
                <ListTodo className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-black uppercase tracking-widest text-[10px] md:text-xs">Action Roadmap</h3>
              </div>
              <div className="grid gap-3 md:gap-4">
                {idea.actionItems.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center p-4 md:p-6 glass rounded-2xl md:rounded-3xl"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-black mr-4 md:mr-5 text-sm md:text-base">{i+1}</div>
                    <span className="text-slate-300 font-medium text-sm md:text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-3 text-slate-500">
                <AlignLeft className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-black uppercase tracking-widest text-[10px] md:text-xs">Verbatim Log</h3>
              </div>
              <div className="glass p-5 md:p-8 rounded-3xl md:rounded-[2rem] font-mono text-xs md:text-sm leading-relaxed text-slate-400 italic">
                "{idea.transcript}"
              </div>
            </section>
          </div>

          {/* Visualization Column */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="sticky top-24">
              <div className="glass p-3 md:p-4 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-3xl">
                {idea.imageUrl ? (
                  <img src={idea.imageUrl} className="w-full h-48 md:h-80 object-cover rounded-2xl md:rounded-[2rem]" alt="" />
                ) : (
                  <div className="h-48 md:h-80 bg-slate-900 flex items-center justify-center rounded-2xl md:rounded-[2rem]">
                    <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-slate-800" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={startChat}
                className="w-full mt-4 md:mt-6 py-4 md:py-5 bg-gradient-to-r from-primary to-secondary text-background font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-3"
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span>Consult Brainstormer</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Chat Overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-x-0 bottom-0 h-[70vh] md:h-[60vh] glass-plus z-[100] border-t border-primary/20 rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col bg-surface"
          >
            <div className="flex items-center justify-between px-6 md:px-10 py-4 md:py-6 border-b border-white/5">
               <div className="flex items-center space-x-3">
                 <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                   <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                 </div>
                 <h4 className="font-black text-[10px] md:text-xs uppercase tracking-widest">Brainstorming Follow-up</h4>
               </div>
               <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest">Minimize</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <p className="text-slate-400 font-medium max-w-xs text-sm">Ask anything about this idea. Gemini has the full context of your voice note.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-[2rem] text-sm md:text-base ${m.role === 'user' ? 'bg-primary text-background font-bold' : 'glass text-slate-200'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass p-4 md:p-5 rounded-[2rem] flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin text-primary" />
                    <span className="text-[10px] md:text-xs font-bold uppercase text-slate-500 animate-pulse">Gemini is thinking</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-8 border-t border-white/5 pb-8 md:pb-8">
              <div className="relative">
                <input 
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a follow-up question..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-[2rem] py-4 md:py-5 pl-6 md:pl-8 pr-14 md:pr-16 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-slate-600 text-sm md:text-base"
                />
                <button 
                  onClick={sendMessage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-primary text-background rounded-full hover:scale-110 transition-transform"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
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