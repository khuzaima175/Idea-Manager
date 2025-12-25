import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Lightbulb, Sparkles } from 'lucide-react';

interface TextIdeaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => Promise<void>;
    isProcessing: boolean;
}

const TextIdeaModal: React.FC<TextIdeaModalProps> = ({ isOpen, onClose, onSubmit, isProcessing }) => {
    const [text, setText] = useState('');

    const handleSubmit = async () => {
        if (!text.trim() || isProcessing) return;
        await onSubmit(text);
        setText('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                                    <Lightbulb className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Quick Capture</h3>
                                    <p className="text-xs text-slate-500">Type your idea and let AI do the rest</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Describe your idea in detail... What's the concept? What problem does it solve? Any initial thoughts on implementation?"
                                className="w-full h-48 bg-background/50 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm leading-relaxed"
                                disabled={isProcessing}
                                autoFocus
                            />

                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-slate-500">
                                    <Sparkles className="w-3 h-3 inline mr-1" />
                                    AI will generate title, summary, tags, and action items
                                </p>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!text.trim() || isProcessing}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-background font-bold text-sm rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Capture Idea
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextIdeaModal;
